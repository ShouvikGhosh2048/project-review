"use client"

import { Button } from "@mantine/core"
import { signIn, signOut } from "next-auth/react"

export function SignIn() {
    return <Button onClick={() => signIn("github")} variant="default">Sign in</Button>
}

export function SignOut() {
    return <Button onClick={() => signOut()} variant="default">Sign out</Button>
}