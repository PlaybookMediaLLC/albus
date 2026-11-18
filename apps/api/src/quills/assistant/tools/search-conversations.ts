// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { z } from "../../../openapi";
import {
  listConversations,
  listFilters,
} from "../../support/conversation-list";
import { defineReadTool } from "../ai/tool";

export const searchConversations = defineReadTool({
  name: "search_conversations",
  description:
    "Search the workspace's conversations by subject, customer name or message text, for example a customer's earlier conversations. Returns at most 5, newest first.",
  args: z.object({ query: z.string().trim().min(1).max(200) }),
  action: "read",
  run: async (db, context, args) => {
    const { items } = await listConversations(
      db,
      {
        principalId: context.principalId as never,
        userId: "",
        workspaceId: context.workspaceId,
      } as never,
      // The filters parse a query string, so the limit is text.
      listFilters.parse({ search: args.query, limit: "5" }),
    );
    const found = items.filter((item) => item.id !== context.conversationId);
    return {
      content: found.length
        ? found
            .map(
              (item) =>
                `[conversation:${item.id}] ${item.subject ?? "(no subject)"} - ${item.status}, customer ${item.visitorName ?? "unknown"}\n${item.lastMessagePreview ?? ""}`,
            )
            .join("\n\n")
        : "No results.",
      summary: `${found.length} conversations`,
    };
  },
});
