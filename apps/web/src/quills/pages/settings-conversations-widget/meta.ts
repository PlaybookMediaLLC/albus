import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-conversations-widget",
  feature: "settings-conversations",
  route: "/feedback/$workspaceId/settings/conversations/widget",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsWidgetSettings",
    "updateQuillsWidgetSettings",
    "createQuillsSettingsUpload",
    "saveQuillsWidgetHeroImageKey",
    "deleteQuillsWidgetHeroImage",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
