"use client"

import { Button, Flex, TextInput } from "@mantine/core";
import { useFormState } from "react-dom";
import { createProject } from "~/server/actions";

export default function NewProjectForm() {
    const [error, formAction] = useFormState(createProject, '');

    return (
        <form action={formAction}>
            <Flex gap="sm" align="center">
                <TextInput placeholder="Username/Repository" name="repository"/>
                <Button type="submit">Create</Button>
                {error && <span>{error}</span>}
            </Flex>
        </form>
    );
}