import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-conversations-moderation",
  feature: "settings-conversations",
  route: "/feedback/$workspaceId/settings/conversations/moderation",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsModerationStatus",
    "listQuillsPendingModeration",
    "approveQuillsPost",
    "rejectQuillsPost",
    "approveQuillsComment",
    "rejectQuillsComment",
    "getQuillsSpamFilterConfig",
    "updateQuillsSpamFilterConfig",
    "listQuillsFlaggedMessages",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
