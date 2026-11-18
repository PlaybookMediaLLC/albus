// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { z } from "../../../openapi";
import { defineWriteTool } from "../ai/tool";

/** TODO(quills-ai): what the tool changes, in one sentence the model reads. */
export const {{camel}} = defineWriteTool({
  name: "{{snake}}",
  description: "TODO(quills-ai): propose the change for the current conversation. A teammate must approve it.",
  args: z.object({ value: z.string().trim().min(1).max(200) }),
  // The approval route checks quills:update; a tool that needs more cannot be approved safely.
  action: "update",
  // `required`: a teammate approves a pending action. `auto`: runs with the answer; only for a
  // change that is internal to the team and easy to undo.
  approval: "required",
  available: (context) => Boolean(context.conversationId),
  summary: (args) => `TODO(quills-ai): ${args.value}`,
  // Runs in the approving (or, for `auto`, the asking) teammate's transaction, through the same
  // domain function that teammate's own route calls. Return null when nothing changed.
  execute: async (_db, _actor, _conversation, _args) => {
    // TODO(quills-ai): call the domain function and return conversationChange(...).
    return null;
  },
});
