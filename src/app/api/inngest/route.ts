import {serve} from "inngest/next";
import {processMessage} from "@/features/conversations/inngest/process-message";
import {exportToGithub} from "@/features/projects/inngest/export-github-repo";
import {importGithubRepo} from "@/features/projects/inngest/import-github-repo";
import {inngest} from "@/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processMessage, importGithubRepo, exportToGithub],
});
