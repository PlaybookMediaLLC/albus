import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-conversations-topics",
  feature: "settings-conversations",
  route: "/feedback/$workspaceId/settings/conversations/topics",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsConversationTags",
    "listQuillsConversationTagUsage",
    "createQuillsConversationTag",
    "updateQuillsConversationTag",
    "archiveQuillsConversationTag",
    "restoreQuillsConversationTag",
    "deleteQuillsConversationTag",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
