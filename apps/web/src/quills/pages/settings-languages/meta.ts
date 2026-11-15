import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-languages",
  feature: "settings-workspace",
  route: "/feedback/$workspaceId/settings/languages",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsHelpCenterSettings",
    "enableQuillsHelpCenterLocale",
    "disableQuillsHelpCenterLocale",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
