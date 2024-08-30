"use server"

import { z } from "zod";
import { octokit } from "./octokit";
import { getServerAuthSession } from "./auth";
import { db } from "./db";
import { projects, reviews } from "./db/schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const projectSchema = z.object({
    repository: z.string().min(1),
});

export async function createProject(prevState: string, formData: FormData) {
    const session = await getServerAuthSession();
    if (!session) {
        return "User needs to be logged in.";
    }

    const project = projectSchema.safeParse({
        repository: formData.get("repository"),
    });
    if (project.error) {
        return "Repository needed."
    }

    const { repository } = project.data;
    const [owner, repo, ...remaining] = repository.split("/");
    if (owner === undefined || repo === undefined || remaining.length > 0) {
        return "Invalid repository name.";
    }

    // TODO: Should I have more checks on owner/repo?
    // https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/iam-configuration-reference/username-considerations-for-external-authentication
    // https://stackoverflow.com/a/59082561
    try {
        await octokit.request('GET /repos/{owner}/{repo}', {
            owner: owner,
            repo: repo,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
        });
    } catch {
        return "The repository doesn't exist/is private.";
    }

    let id = "";
    try {
        const project = await db.insert(projects).values({
            repository,
            userId: session.user.id,
        }).returning({ id: projects.id });
        id = project[0]!.id; // project[0] should exist since we created it?
    } catch (e) {
        // https://stackoverflow.com/a/55760610
        if ((e as { 'constraint_name'?: unknown }).constraint_name === "repo_and_user") {
            return "Project already exists.";
        } else {
            return "Couldn't create project: DB error.";
        }
    }

    revalidatePath("/");
    redirect(`/project/${id}`);
}

const reviewSchema = z.object({
    review: z.string().min(1),
});

export async function createReview(projectId: string, prevState: { error?: string, review?: string }, formData: FormData) {
    const session = await getServerAuthSession();
    if (!session) {
        return {
            error: "User needs to be logged in.",
        };
    }

    const review = reviewSchema.safeParse({
        review: formData.get('review'),
    });
    if (review.error) {
        return {
            error: "Review required.",
        };
    }

    const project = await db.query.projects.findFirst({
        columns: {
            userId: true,
        },
        where: eq(projects.id, projectId)
    });
    if (!project) {
        return {
            error: "Project doesn't exist.",
        };
    }
    if (project.userId !== session.user.id) {
        return {
            error: "You don't own the project.",
        };
    }

    try {
        const newReview = await db.insert(reviews).values({
            text: review.data.review,
            projectId,
        }).returning({
            id: reviews.id,
        });
        revalidatePath(`/project/${projectId}`);
        return {
            review: newReview[0]!.id // We created a review, so newReview[0] should exist.
        };
    } catch {
        return {
            error: "Couldn't create the review: DB error.",
        };
    }
}