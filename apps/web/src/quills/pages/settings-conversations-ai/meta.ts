import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-conversations-ai",
  feature: "settings-conversations",
  route: "/feedback/$workspaceId/settings/conversations/ai",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: ["getQuillsAssistantSettings", "updateQuillsAssistantSettings"],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
