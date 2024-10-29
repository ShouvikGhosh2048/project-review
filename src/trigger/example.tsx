import { schedules } from "@trigger.dev/sdk/v3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema";
import { Octokit } from "octokit";
import { Resend } from "resend";
import ReviewReminder from "../../emails/reviewReminder";
import * as React from "react";
import { eq } from "drizzle-orm";

const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });
const conn = postgres(process.env.DATABASE_URL!);
const db = drizzle(conn, { schema });
const resend = new Resend(process.env.RESEND_API_KEY);

export const checkRepos = schedules.task({
  id: "check-repos",
  cron: "0 6 * * *",
  run: async (payload) => {
    const projects = await db.query.projects.findMany({
      columns: {
        repository: true,
        id: true,
      },
      with: {
        user: {
          columns: {
            email: true,
          }
        }
      }
    });

    const repositoryToProjects = new Map<string, typeof projects>();
    projects.forEach(project => {
      const repositoryProjects = repositoryToProjects.get(project.repository);
      if (repositoryProjects) {
        repositoryProjects.push(project);
      } else {
        repositoryToProjects.set(project.repository, [project]);
      }
    });

    const emails: { from: string, to: string[], subject: string, react: JSX.Element }[] = [];
    await Promise.all([...repositoryToProjects.entries()].map(async ([repository, projects]) => {
      try {
        const [owner, repo] = repository.split("/");
        if (owner === undefined || repo === undefined) {
          return;
        }

        const githubRepo = await octokit.request('GET /repos/{owner}/{repo}', {
          owner: owner,
          repo: repo,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        const lastUpdated = new Date(githubRepo.data.pushed_at);
        const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
        const lastUpdatedDay = Math.floor(lastUpdated.valueOf() / MILLISECONDS_IN_A_DAY);
        const today = Math.floor(payload.timestamp.valueOf() / MILLISECONDS_IN_A_DAY);
        if ([30, 60, 90].includes(today - lastUpdatedDay)) {
          projects.forEach(project => {
            emails.push({
              from: 'Shouvik <shouvik@resend.dev>',
              to: [project.user.email],
              subject: `Review reminder for ${repository}`,
              react: <ReviewReminder repository={repository} 
                        daysSinceLastUpdate={today - lastUpdatedDay}
                        projectId={project.id}/>,
            });
          });
        }
      } catch {}
    }));

    for (const email of emails) {
      await resend.emails.send(email);
    }
  },
});

export const addNewRepos = schedules.task({
  id: "add-new-repos",
  cron: "0 6 * * *",
  run: async (payload) => {
    const [projects, githubUsers] = await Promise.all([
      db.query.projects.findMany({
        columns: {
          repository: true,
        },
        with: {
          user: {
            columns: {
              id: true,
            }
          }
        }
      }),
      db.query.users.findMany({
        columns: {
          id: true,
          
        },
        with: {
          accounts: {
            columns: {
              providerAccountId: true,
            },
            // TODO: Can there be multiple Github accounts for the same user?
            where: eq(schema.accounts.provider, "github"),
          }
        }
      })
    ]);

    const userIdToProjects = new Map<string, Set<string>>();
    projects.forEach(project => {
      const projects = userIdToProjects.get(project.user.id);
      if (projects) {
        projects.add(project.repository);
      } else {
        userIdToProjects.set(project.user.id, new Set([project.repository]));
      }
    });

    const newProjects: { userId: string, repository: string }[] = [];
    await Promise.all(githubUsers.map(async (user) => {
      try {
        // TODO: I assume 1 Github account per user here.
        const projects = userIdToProjects.get(user.id) ?? new Set<string>();

        if (!user.accounts[0]) {
          return;
        }
        const userDetails = await octokit.request('GET /user/{account_id}', {
          account_id: user.accounts[0].providerAccountId,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        const githubRepos = ((await octokit.request('GET /users/{username}/repos', {
          username: (userDetails.data as { login: string}).login,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          },
          sort: 'created',
        })).data as { full_name: string, created_at: string }[]).map(repo => ({ name: repo.full_name, createdAt: new Date(repo.created_at) }));
        // TODO: Technically you should fetch more repos, since this is only the first page.
        // TODO: Maybe check that we don't add repos which were created before the user joined.

        const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
        githubRepos.forEach(repo => {
          const created = Math.floor(repo.createdAt.valueOf() / MILLISECONDS_IN_A_DAY);
          const today = Math.floor(payload.timestamp.valueOf() / MILLISECONDS_IN_A_DAY);
          if (today - created <= 1 && !projects.has(repo.name)) {
            newProjects.push({
              userId: user.id,
              repository: repo.name,
            });
          }
        });
      } catch {}
    }));

    await db.insert(schema.projects).values(newProjects).onConflictDoNothing();
  },
});