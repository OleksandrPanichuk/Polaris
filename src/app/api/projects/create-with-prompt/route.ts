import {auth} from "@clerk/nextjs/server";
import {api} from "@convex/api";
import {DEFAULT_CONVERSATION_TITLE} from "@convex/constants";
import {NextResponse} from "next/server";
import {adjectives, animals, colors, uniqueNamesGenerator} from "unique-names-generator";
import {z} from "zod";
import {inngest} from "@/inngest/client";
import {convex} from "@/lib/convex-client";

const requestSchema = z.object({
  prompt: z.string().min(1),
});

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      {
        error: "Internal key not configured",
      },
      {
        status: 500,
      },
    );
  }

  const body = await req.json();
  const { prompt } = requestSchema.parse(body);

  const projectName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    separator: "-",
    length: 3,
  });

  const { projectId, conversationId } = await convex.mutation(
    api.system.createProjectWithConversation,
    {
      conversationTitle: DEFAULT_CONVERSATION_TITLE,
      ownerId: userId,
      internalKey,
      projectName,
    },
  );

  await convex.mutation(api.system.createMessage, {
    content: prompt,
    role: "user",
    internalKey,
    conversationId,
    projectId,
  });

  const assistantMessageId = await convex.mutation(api.system.createMessage, {
    role: "assistant",
    content: "",
    status: "processing",
    internalKey,
    conversationId,
    projectId,
  });

  await inngest.send({
    name: "message/name",
    data: {
      messageId: assistantMessageId,
      message: prompt,
      conversationId,
      projectId,
    },
  });

  return NextResponse.json({ projectId });
}
