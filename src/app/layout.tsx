import "~/styles/globals.css";
import "@mantine/core/styles.css";
import '@mantine/nprogress/styles.css';

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ColorSchemeScript, Flex, MantineProvider, Text } from "@mantine/core";
import { getServerAuthSession } from "~/server/auth";
import Link from "next/link";
import { SignIn } from "./SignInButtons";
import AccountPopover from "./AccountPopover";
import { NavigationProgress } from "@mantine/nprogress";

export const metadata: Metadata = {
  title: "Project Review",
  description: "A website to review your projects.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerAuthSession();

  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={GeistSans.className}
        style={{
          'padding': '10px',
          'margin': 'auto',
          'maxWidth': '1000px',
        }}>
        <MantineProvider>
          <NavigationProgress/>
          <Flex component="nav" justify="space-between" align="center" h="40px" mb="sm">
            <Link href="/"><Text size="xl" fw={500}>Project Review</Text></Link>
            {session && (
              <Flex align="center" gap="sm">
                <AccountPopover image={session.user.image ?? undefined}/>
              </Flex>
            )}
            {!session && <SignIn />}
          </Flex>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
