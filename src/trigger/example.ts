import { schedules } from "@trigger.dev/sdk/v3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema";
import { Octokit } from "octokit";
import { Resend } from "resend";

const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });
const conn = postgres(process.env.DATABASE_URL!);
const db = drizzle(conn, { schema });
const resend = new Resend(process.env.RESEND_API_KEY);

export const checkRepos = schedules.task({
  id: "check-repos",
  cron: "0 6 * * 0",
  run: async (payload) => {
    const projects = await db.query.projects.findMany({
      columns: {
        repository: true,
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

    const emails: { from: string, to: string[], subject: string, html: string }[] = [];
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
              html: `It's been ${today - lastUpdatedDay} days since ${repository} has been updated. Time for review?`,
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