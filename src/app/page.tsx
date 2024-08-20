"use client";

import { signIn } from "next-auth/react";
import { Button } from "@mantine/core";

export default function Home() {
  return (
    <main>
      <Button onClick={() => signIn("github")}>Sign in</Button>
    </main>
  );
}
