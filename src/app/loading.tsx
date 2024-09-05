"use client"

import { nprogress } from "@mantine/nprogress";
import { useEffect } from "react";

// https://github.com/orgs/mantinedev/discussions/6516
// https://v6.mantine.dev/others/nprogress/#usage-with-nextjs

export default function Loading() {
    useEffect(() => {
        let state = 'waiting';

        const timeout = setTimeout(() => {
            if (state === 'waiting') {
                state = 'start';
                nprogress.start();
            }
        }, 500);

        return () => {
            if (state === 'start') {
                nprogress.complete();
            } else {
                state = 'done';
                clearTimeout(timeout);
            }
        };
    }, []);
    return <></>;
}