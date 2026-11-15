import type { ListConversationTagUsageResponse } from "./list-conversation-tag-usage";
export const listConversationTagUsageFixture = {
  ok: (overrides: Partial<ListConversationTagUsageResponse> = {}) =>
    ({
      ...{ items: [] },
      ...overrides,
    }) satisfies ListConversationTagUsageResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
