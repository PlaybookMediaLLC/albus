import type { GetConversationRoutingResponse } from "./get-conversation-routing";
export const getConversationRoutingFixture = {
  ok: (overrides: Partial<GetConversationRoutingResponse> = {}) =>
    ({
      ...{ enabled: false, strategy: "auto_assign_active" },
      ...overrides,
    }) satisfies GetConversationRoutingResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
