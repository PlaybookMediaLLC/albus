import type { UpdateConversationTagResponse } from "./update-conversation-tag";
export const updateConversationTagFixture = {
  ok: (overrides: Partial<UpdateConversationTagResponse> = {}) =>
    ({
      ...{ id: "id_test_1", name: "value", color: "value" },
      ...overrides,
    }) satisfies UpdateConversationTagResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
