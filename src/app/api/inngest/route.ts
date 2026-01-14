import {serve} from "inngest/next";
import {processMessage} from "@/features/conversations/inngest/process-message";
import {inngest} from "@/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processMessage],
});
