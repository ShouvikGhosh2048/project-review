"use client"

import { Flex, Stack, TextInput } from "@mantine/core";
import { useFormState } from "react-dom";
import FormSubmitButton from "~/app/FormSubmitButton";
import { createProject } from "~/server/actions";

export default function NewProjectForm() {
    const [error, formAction] = useFormState(createProject, '');

    return (
        <form action={formAction}>
            <Stack>
                {error && <span>{error}</span>}
                <Flex gap="sm" align="stretch">
                    <TextInput placeholder="Username/Repository" name="repository" size="md" required/>
                    <FormSubmitButton text="Create"/>
                </Flex>
            </Stack>
        </form>
    );
}