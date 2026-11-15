import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-member",
  feature: "team-members",
  route: "/feedback/$workspaceId/members/$principalId",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsUser",
    "listQuillsPosts",
    "listQuillsUserComments",
    "listQuillsStatuses",
    "listQuillsBoards",
    "listQuillsUserAttributes",
    "updateQuillsUser",
    "blockQuillsUser",
    "unblockQuillsUser",
    "deleteQuillsUser",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
