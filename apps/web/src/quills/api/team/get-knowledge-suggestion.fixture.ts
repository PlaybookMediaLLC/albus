import type { GetKnowledgeSuggestionResponse } from "./get-knowledge-suggestion";
export const getKnowledgeSuggestionFixture = {
  ok: (overrides: Partial<GetKnowledgeSuggestionResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        status: "awaiting_answer",
        gap: false,
        topic: "value",
        candidateTitle: "value",
        candidateContent: "value",
        title: null,
        content: null,
        evidenceCount: 0,
        questionCount: 0,
        stepIndex: 0,
        approvedSnippetId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        questions: [],
      },
      ...overrides,
    }) satisfies GetKnowledgeSuggestionResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
