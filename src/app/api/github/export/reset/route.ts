import {auth} from "@clerk/nextjs/server";
import {api} from "@convex/api";
import type {Id} from "@convex/dataModel";
import {NextResponse} from "next/server";
import {z} from "zod";
import {convex} from "@/lib/convex-client";

const requestSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId } = requestSchema.parse(body);

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  await convex.mutation(api.system.updateExportStatus, {
    internalKey,
    projectId: projectId as Id<"projects">,
    status: undefined,
    repoUrl: undefined,
  });

  return NextResponse.json({
    success: true,
    projectId,
  });
}
