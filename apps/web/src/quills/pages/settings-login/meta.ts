import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-login",
  feature: "settings-product",
  route: "/feedback/$workspaceId/settings/login",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsPortalSettings",
    "updateQuillsPortalSettings",
    "getQuillsWidgetSecret",
    "rotateQuillsWidgetSecret",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
