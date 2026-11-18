import type { GetKnowledgeSuggestionResponse } from "../../api/team/get-knowledge-suggestion";
import type { ListKnowledgeSuggestionsResponse } from "../../api/team/list-knowledge-suggestions";

type Suggestion = ListKnowledgeSuggestionsResponse["items"][number];

/** The test suggestions of the knowledge page. The default one waits for its first answer. */
export const knowledgeFixture = {
  suggestion: (overrides: Partial<Suggestion> = {}): Suggestion => ({
    id: "knowledge_test_1",
    status: "awaiting_answer",
    gap: true,
    topic: "How do refunds work?",
    candidateTitle: "Refunds",
    candidateContent: "Refunds take five days.",
    title: null,
    content: null,
    evidenceCount: 2,
    questionCount: 2,
    stepIndex: 0,
    approvedSnippetId: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-02T00:00:00.000Z",
    ...overrides,
  }),
  detail: (
    overrides: Partial<GetKnowledgeSuggestionResponse> = {},
  ): GetKnowledgeSuggestionResponse => ({
    ...knowledgeFixture.suggestion(),
    questions: [
      {
        position: 0,
        question: "Do refunds include shipping?",
        suggestedAnswers: ["Yes", "No"],
        answer: null,
        skipped: false,
      },
      {
        position: 1,
        question: "Who approves a refund?",
        suggestedAnswers: [],
        answer: null,
        skipped: false,
      },
    ],
    ...overrides,
  }),
  list: (items: Suggestion[]) =>
    ({ items }) satisfies ListKnowledgeSuggestionsResponse,
};
