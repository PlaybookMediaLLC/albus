import type { CreateConversationTagResponse } from "./create-conversation-tag";
export const createConversationTagFixture = {
  ok: (overrides: Partial<CreateConversationTagResponse> = {}) =>
    ({
      ...{ id: "id_test_1", name: "value", color: "value", created: false },
      ...overrides,
    }) satisfies CreateConversationTagResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
