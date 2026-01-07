import {sentryMiddleware} from "@inngest/middleware-sentry"; // Create a client to send and receive events
import {Inngest} from "inngest"; // Create a client to send and receive events

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "polaris",
  middleware: [sentryMiddleware()],
});
