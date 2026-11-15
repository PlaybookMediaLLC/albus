import type { DeleteConversationTagResponse } from "./delete-conversation-tag";
export const deleteConversationTagFixture = {
  ok: (overrides: Partial<DeleteConversationTagResponse> = {}) =>
    ({
      ...{ id: "id_test_1" },
      ...overrides,
    }) satisfies DeleteConversationTagResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
