import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-roadmap",
  feature: "team-roadmap",
  route: "/feedback/$workspaceId/roadmap",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  // The statuses, boards and counts load first. Then each open column lists its posts.
  operations: [
    "listQuillsStatuses",
    "listQuillsBoards",
    "getQuillsPostFilterCounts",
    "listQuillsPosts",
    "setQuillsPostStatus",
    "reorderQuillsStatuses",
  ],
  states: ["loading", "failed", "empty", "ready", "done"],
} satisfies PageMeta;
