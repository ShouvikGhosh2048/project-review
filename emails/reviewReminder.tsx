import { Html, Link } from "@react-email/components";
import * as React from "react";

export default function ReviewReminder(props: {
    repository: string,
    daysSinceLastUpdate: number,
    projectId: string,
}) {
    return (
        <Html style={{ fontFamily: "sans-serif"}}>
            It&apos;s been {props.daysSinceLastUpdate} days since {props.repository} has been updated. Time for a review?
            Visit the <Link href={`https://project-review-pi.vercel.app/project/${props.projectId}`}>project</Link> to leave a review.
        </Html>
    );
}