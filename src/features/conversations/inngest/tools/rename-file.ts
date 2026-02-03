import {api} from "@convex/api";
import type {Id} from "@convex/dataModel";
import {createTool} from "@inngest/agent-kit";
import {z} from "zod";
import {convex} from "@/lib/convex-client";

interface IRenameFileToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z
    .string()
    .min(1, "File ID is required")
    .describe("The ID of the file or folder to rename"),
  newName: z
    .string()
    .min(1, "New name is required")
    .describe("The new name for the file or folder"),
});

export const createRenameFileTool = ({
  internalKey,
}: IRenameFileToolOptions) => {
  return createTool({
    name: "renameFile",
    description: "Rename a file or folder",
    parameters: paramsSchema,
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileId, newName } = parsed.data;

      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });

      if (!file) {
        return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
      }

      try {
        return await toolStep?.run("rename-file", async () => {
          await convex.mutation(api.system.renameFile, {
            internalKey,
            fileId: fileId as Id<"files">,
            newName,
          });

          return `Renamed "${file.name}" to "${newName}" successfully`;
        });
      } catch (error) {
        return `Error renaming file: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
