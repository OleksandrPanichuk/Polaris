import {api} from "@convex/api";
import type {Id} from "@convex/dataModel";
import {createTool} from "@inngest/agent-kit";
import {z} from "zod";
import {convex} from "@/lib/convex-client";

interface IUpdateFileToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z
    .string()
    .min(1, "File ID is required")
    .describe("The ID of the file to update"),
  content: z.string().describe("The new content for the file"),
});
export const createUpdateFileTool = ({
  internalKey,
}: IUpdateFileToolOptions) => {
  return createTool({
    name: "updateFile",
    description: "Update the content of an existing file",
    parameters: paramsSchema,
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);

      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileId, content } = parsed.data;

      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });

      if (!file) {
        return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
      }

      if (file.type === "folder") {
        return `Error: "${fileId}" is a folder, not a file. You can only update file contents.`;
      }

      try {
        return await toolStep?.run("update-file", async () => {
          await convex.mutation(api.system.updateFile, {
            internalKey,
            fileId: fileId as Id<"files">,
            content,
          });

          return `File "${file.name}" updated successfully`;
        });
      } catch (error) {
        return `Error update file: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
