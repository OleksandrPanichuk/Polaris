import {auth, clerkClient} from "@clerk/nextjs/server";
import {api} from "@convex/api";
import {NextResponse} from "next/server";
import {z} from "zod";
import {inngest} from "@/inngest/client";
import {convex} from "@/lib/convex-client";

const requestSchema = z.object({
  url: z.url(),
});

function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url } = requestSchema.parse(body);

  const { owner, repo } = parseGitHubUrl(url);

  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");

  const githubToken = tokens.data[0]?.token;

  if (!githubToken) {
    return NextResponse.json(
      { error: "GitHub not connected. Please reconnect your GitHub account." },
      { status: 400 },
    );
  }

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const projectId = await convex.mutation(api.system.createProject, {
    internalKey,
    name: repo,
    ownerId: userId,
  });

  const event = await inngest.send({
    name: "github/import.repo",
    data: {
      owner,
      repo,
      projectId,
      githubToken,
    },
  });

  return NextResponse.json({
    success: true,
    eventId: event.ids[0],
    projectId,
  });
}
