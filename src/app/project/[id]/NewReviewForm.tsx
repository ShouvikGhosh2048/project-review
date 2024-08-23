"use client"

import { Button, Stack, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";

export default function NewReviewForm(props: {
    // TODO: Improve the type.
    action: (prevState: { error?: string, review?: string }, formData: FormData) => Promise<{ error?: string, review?: string }>
}) {
    const [state, formAction] = useFormState(props.action, { review: "" });
    const [review, setReview] = useState("");
    useEffect(() => {
        if (state.review) {
            setReview("");
        }
    }, [state]);

    return (
        <form action={formAction}>
            <Stack align="end">
                {state.error && <p style={{ "width": "100%", margin: "0" }}>{state.error}</p>}
                <Textarea rows={5} placeholder="Review" name="review"
                    value={review} onChange={(e) => { setReview(e.target.value); }} w="100%" />
                <Button type="submit">Create review</Button>
            </Stack>
        </form>
    );
}