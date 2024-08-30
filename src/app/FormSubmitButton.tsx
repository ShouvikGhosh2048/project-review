"use client"

import { Button } from "@mantine/core";
import { useFormStatus } from "react-dom";

export default function FormSubmitButton(props: { text: string }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{props.text}</Button>;
}