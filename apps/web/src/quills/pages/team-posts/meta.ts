import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-posts",
  feature: "team-posts",
  route: "/feedback/$workspaceId/posts",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  // The order of the requests: listQuillsPosts waits for the statuses. The New request
  // dialog (`new=true`) is shared with the roadmap in team/new-request and loads its own data.
  operations: [
    "listQuillsStatuses",
    "listQuillsBoards",
    "listQuillsPosts",
    "restoreQuillsPost",
  ],
  states: ["loading", "failed", "empty", "ready", "done"],
} satisfies PageMeta;
