"use client"

import { Avatar, Button, Popover, Stack } from "@mantine/core"
import Link from "next/link";
import { SignOut } from "./SignInButtons";
import { useState } from "react";

export default function AccountPopover(props: { image?: string }) {
    const [opened, setOpened] = useState(false);

    return (
        <Popover shadow="md" opened={opened} onChange={setOpened}>
            <Popover.Target>
                <Avatar src={props.image} alt="User image"
                        style={{ "cursor": "pointer" }}
                        onClick={() => setOpened(o => !o)}/>
            </Popover.Target>
            <Popover.Dropdown>
            <Stack>
                <Link href="/project/new">
                    <Button variant="default" onClick={() => setOpened(false)}>New project</Button>
                </Link>
                <SignOut />
            </Stack>
            </Popover.Dropdown>
        </Popover>
    );
}