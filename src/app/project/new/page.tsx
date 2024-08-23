import { Stack, Text, Title } from "@mantine/core";
import { z } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { octokit } from "~/server/octokit";
import NewProjectForm from "./NewProjectForm";

const githubUserSchema = z.object({
    login: z.string(),
});
const githubReposSchema = z.object({
    full_name: z.string(),
}).array();

export default async function NewProject() {
    const session = await getServerAuthSession();
    if (!session) { return <div>Sign in to create a new project.</div>; }

    const account = await db.query.accounts.findFirst({
        columns: {
            providerAccountId: true,
        },
        where: (accounts, { eq }) => eq(accounts.userId, session.user.id)
    });
    const githubID = account?.providerAccountId;
    if (githubID === undefined) {
        return <div>Github ID not found.</div>;
    }

    const githubUser = githubUserSchema.parse(
        (await octokit.request('GET /user/{account_id}', {
            account_id: githubID,
            headers: {
            'X-GitHub-Api-Version': '2022-11-28'
            }
        })).data
    );
    const repos = githubReposSchema.parse(
        (await octokit.request('GET /users/{username}/repos?sort=created&per_page=10', {
            username: githubUser.login,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
        })).data
    );
    const repoNames = repos.map(repo => repo.full_name);

    return (
        <Stack>
            <Title>New project</Title>
            <NewProjectForm/>
            <Stack gap="sm">
                <Title order={2}>Your recent repositories</Title>
                <div>
                    {repoNames.map((name, i) => <Text key={i}>{name}</Text>)}
                </div>
            </Stack>
        </Stack>
    )
}