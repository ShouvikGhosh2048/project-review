import { Octokit } from "octokit";
import { env } from "~/env";

export const octokit = new Octokit({ auth: env.OCTOKIT_TOKEN });