import type { SetConversationRoutingResponse } from "./set-conversation-routing";
export const setConversationRoutingFixture = {
  ok: (overrides: Partial<SetConversationRoutingResponse> = {}) =>
    ({
      ...{ enabled: false, strategy: "auto_assign_active" },
      ...overrides,
    }) satisfies SetConversationRoutingResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
