import type { ListKnowledgeSuggestionsResponse } from "./list-knowledge-suggestions";
export const listKnowledgeSuggestionsFixture = {
  ok: (overrides: Partial<ListKnowledgeSuggestionsResponse> = {}) =>
    ({
      ...{ items: [] },
      ...overrides,
    }) satisfies ListKnowledgeSuggestionsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
