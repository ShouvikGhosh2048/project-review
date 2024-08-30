import { Stack, Title } from "@mantine/core";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { projects, reviews } from "~/server/db/schema";
import NewReviewForm from "./NewReviewForm";
import { createReview } from "~/server/actions";

export default async function Project({ params }: {
    params: {
        id: string
    }
}) {
    const session = await getServerAuthSession();
    if (!session) {
        return <main>You need to log in to view projects.</main>;
    }

    const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, params.id), eq(projects.userId, session.user.id)),
        with: {
            reviews: {
                columns: {
                    text: true,
                    createdAt: true,
                },
                orderBy: [desc(reviews.createdAt)]
            },
        },
    });
    if (!project) {
        notFound();
    }

    const formAction = createReview.bind(null, params.id);

    return (
        <main>
            <Stack>
                <Title style={{ "wordBreak": "break-all" }}>{project.repository}</Title>
                <NewReviewForm action={formAction}/>
                <Title order={2}>Reviews:</Title>
                {project.reviews.map((review, i) => (
                    <p key={i} style={{ "wordBreak": "break-all", "margin": "0" }}>{review.text}</p>
                ))}
            </Stack>
        </main>
    );
}