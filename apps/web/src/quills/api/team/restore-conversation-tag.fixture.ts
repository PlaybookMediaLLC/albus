import type { RestoreConversationTagResponse } from "./restore-conversation-tag";
export const restoreConversationTagFixture = {
  ok: (overrides: Partial<RestoreConversationTagResponse> = {}) =>
    ({
      ...{ id: "id_test_1", name: "value", color: "value" },
      ...overrides,
    }) satisfies RestoreConversationTagResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
