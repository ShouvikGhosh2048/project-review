"use client"

import { Flex, TextInput } from "@mantine/core";
import { useFormState } from "react-dom";
import FormSubmitButton from "~/app/FormSubmitButton";
import { createProject } from "~/server/actions";

export default function NewProjectForm() {
    const [error, formAction] = useFormState(createProject, '');

    return (
        <form action={formAction}>
            <Flex gap="sm" align="center">
                <TextInput placeholder="Username/Repository" name="repository" required/>
                <FormSubmitButton text="Create"/>
                {error && <span>{error}</span>}
            </Flex>
        </form>
    );
}