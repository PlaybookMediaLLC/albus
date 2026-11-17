import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-feedback",
  feature: "settings-product",
  route: "/feedback/$workspaceId/settings/feedback",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsPortalSettings",
    "updateQuillsPortalSettings",
    "listQuillsBoards",
    "createQuillsBoard",
    "updateQuillsBoard",
    "deleteQuillsBoard",
    "listQuillsTags",
    "createQuillsTag",
    "updateQuillsTag",
    "deleteQuillsTag",
    "getQuillsScoringFactors",
    "setQuillsScoringFactors",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
