import type { DismissKnowledgeSuggestionResponse } from "./dismiss-knowledge-suggestion";
export const dismissKnowledgeSuggestionFixture = {
  ok: (overrides: Partial<DismissKnowledgeSuggestionResponse> = {}) =>
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
      },
      ...overrides,
    }) satisfies DismissKnowledgeSuggestionResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
