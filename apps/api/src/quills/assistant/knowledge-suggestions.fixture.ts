import { empty } from "../framework/contract";
import { on } from "./seed.fixture";

export const listQuillsKnowledgeSuggestions = empty;
export const getQuillsKnowledgeSuggestion = on(
  ["knowledge"],
  (a) => ({ params: { suggestionId: a.suggestionId } }),
  (b) => ({ suggestionId: b.suggestionId }),
);
export const answerQuillsKnowledgeSuggestion = on(
  ["knowledge"],
  (a) => ({
    params: { suggestionId: a.suggestionId },
    body: { stepIndex: 0, answer: "All plans." },
  }),
  (b) => ({ suggestionId: b.suggestionId }),
);
export const updateQuillsKnowledgeSuggestion = on(
  ["knowledgeDraft"],
  (a) => ({
    params: { suggestionId: a.draftId },
    body: { content: "Exports run every night at 2 AM." },
  }),
  (b) => ({ suggestionId: b.draftId }),
);
export const approveQuillsKnowledgeSuggestion = on(
  ["knowledgeDraft"],
  (a) => ({
    params: { suggestionId: a.draftId },
    body: { audience: "team" },
  }),
  (b) => ({ suggestionId: b.draftId }),
);
export const dismissQuillsKnowledgeSuggestion = on(
  ["knowledge"],
  (a) => ({ params: { suggestionId: a.suggestionId } }),
  (b) => ({ suggestionId: b.suggestionId }),
);
