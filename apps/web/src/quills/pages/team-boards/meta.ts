import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-boards",
  feature: "boards",
  route: "/feedback/$workspaceId/settings/boards",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsBoards",
    "listQuillsSegments",
    "getQuillsBoardSettings",
    "listQuillsStatuses",
    "updateQuillsBoard",
    "updateQuillsBoardSettings",
    // RFC 0005: the board's delivery project and task rule.
    "setQuillsBoardDelivery",
    "clearQuillsBoardDelivery",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
