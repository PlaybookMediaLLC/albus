// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { z } from "../../../openapi";
import { writeAttributeValue } from "../../support/conversation-attributes";
import { conversationChange, defineWriteTool } from "../ai/tool";

export const setConversationAttribute = defineWriteTool({
  name: "set_conversation_attribute",
  description:
    "Propose a value for one of the workspace's conversation attributes (by its key) on the current conversation. A teammate must approve it.",
  args: z.object({
    key: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9_.-]+$/),
    value: z.union([
      z.string().max(1000),
      z.number(),
      z.boolean(),
      z.array(z.string().max(100)).max(100),
    ]),
  }),
  action: "update",
  approval: "required",
  available: (context) => Boolean(context.conversationId),
  summary: (args) =>
    `Set the attribute ${args.key} to ${JSON.stringify(args.value).slice(0, 200)}`,
  execute: async (db, _actor, conversation, args) => {
    await writeAttributeValue(db, conversation.id, args.key, args.value);
    return conversationChange(conversation, "conversation.attribute_changed", {
      key: args.key,
    });
  },
});
