import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-changelog",
  feature: "settings-product",
  route: "/feedback/$workspaceId/settings/changelog",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsPortalSettings",
    "getQuillsChangelogSettings",
    "updateQuillsChangelogSettings",
    "updateQuillsPortalSettings",
    "listQuillsChangelogCategories",
    "createQuillsChangelogCategory",
    "updateQuillsChangelogCategory",
    "deleteQuillsChangelogCategory",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
