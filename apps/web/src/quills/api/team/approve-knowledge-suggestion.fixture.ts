import type { ApproveKnowledgeSuggestionResponse } from "./approve-knowledge-suggestion";
export const approveKnowledgeSuggestionFixture = {
  ok: (overrides: Partial<ApproveKnowledgeSuggestionResponse> = {}) =>
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
    }) satisfies ApproveKnowledgeSuggestionResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
