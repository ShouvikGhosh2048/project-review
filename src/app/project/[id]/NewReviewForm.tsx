"use client"

import { Alert, Stack, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import FormSubmitButton from "~/app/FormSubmitButton";

export default function NewReviewForm(props: {
    // TODO: Improve the type. Rename review to reviewId.
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
                {state.error && <Alert variant="light" color="red" title="Error" w="100%">{state.error}</Alert>}
                <Textarea rows={5} placeholder="Review" name="review" size="md"
                    value={review} onChange={(e) => { setReview(e.target.value); }} w="100%" required/>
                <FormSubmitButton text="Create review"/>
            </Stack>
        </form>
    );
}