import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-changelog",
  feature: "team-changelog",
  route: "/feedback/$workspaceId/changelog",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsChangelog",
    "searchQuillsShippedPosts",
    "draftQuillsChangelogFromPosts",
    "createQuillsChangelogEntry",
    "listQuillsChangelogEngagement",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
