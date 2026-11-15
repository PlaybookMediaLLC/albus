import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-api",
  feature: "settings-connections",
  route: "/feedback/$workspaceId/settings/api",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: ["getQuillsDeveloperSettings", "updateQuillsDeveloperSettings"],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
