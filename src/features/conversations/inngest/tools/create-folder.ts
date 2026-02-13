import {api} from "@convex/api";
import type {Id} from "@convex/dataModel";
import {createTool} from "@inngest/agent-kit";
import {z} from "zod";
import {convex} from "@/lib/convex-client";

interface ICreateFolderToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

const paramsSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .describe("The name of the folder to create"),
  parentId: z
    .string()
    .describe(
      "The ID (not name!) of the parent folder from listFiles, or empty string for root level",
    ),
});

export const createCreateFolderTool = ({
  projectId,
  internalKey,
}: ICreateFolderToolOptions) => {
  return createTool({
    name: "createFolder",
    description: "Create a new folder in the project",
    parameters: paramsSchema,
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);

      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { name, parentId } = parsed.data;

      try {
        return await toolStep?.run("create-folder", async () => {
          if (parentId) {
            try {
              const parentFolder = await convex.query(api.system.getFileById, {
                internalKey,
                fileId: parentId as Id<"files">,
              });
              if (!parentFolder) {
                return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
              }
              if (parentFolder.type !== "folder") {
                return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
              }
            } catch {
              return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use empty string for root level.`;
            }
          }

          const folderId = await convex.mutation(api.system.createFolder, {
            internalKey,
            projectId,
            name,
            parentId: parentId ? (parentId as Id<"files">) : undefined,
          });

          return `Folder created with ID: ${folderId}`;
        });
      } catch (error) {
        return `Error creating folder: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
