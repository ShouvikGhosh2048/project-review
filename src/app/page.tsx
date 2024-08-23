import { Anchor, Stack, Title } from "@mantine/core";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { projects } from "~/server/db/schema";

export default async function Home() {
  const session = await getServerAuthSession();
  if (!session) {
    return <main>Sign in to view projects.</main>;
  }

  const userProjects = await db.query.projects.findMany({
    columns: {
      repository: true,
      id: true,
    },
    where: eq(projects.userId, session.user.id),
  });

  return (
    <main>
      <Stack>
        <Title>Your projects</Title>
        {userProjects.map(project => 
          <Anchor key={project.id} component={Link} href={`/project/${project.id}`}>{project.repository}</Anchor>
        )}
      </Stack>
    </main>
  );
}
