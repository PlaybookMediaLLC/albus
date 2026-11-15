import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-changelog-entry",
  feature: "team-changelog",
  route: "/feedback/$workspaceId/changelog/$entryId",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsChangelogEntry",
    "createQuillsChangelogEntry",
    "updateQuillsChangelogEntry",
    "deleteQuillsChangelogEntry",
    "listQuillsChangelogCategories",
    "searchQuillsShippedPosts",
    "createQuillsAdminAssistantTransform",
    "getQuillsAssistantSettings",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
