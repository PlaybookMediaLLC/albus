import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-knowledge",
  feature: "knowledge",
  route: "/feedback/$workspaceId/knowledge",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsKnowledgeSuggestions",
    "getQuillsKnowledgeSuggestion",
    "answerQuillsKnowledgeSuggestion",
    "updateQuillsKnowledgeSuggestion",
    "approveQuillsKnowledgeSuggestion",
    "dismissQuillsKnowledgeSuggestion",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
