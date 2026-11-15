import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-privacy",
  feature: "settings-product",
  route: "/feedback/$workspaceId/settings/privacy",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsPortalSettings",
    "updateQuillsPortalSettings",
    "setQuillsModerationDefault",
    "updateQuillsPortalAccess",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
