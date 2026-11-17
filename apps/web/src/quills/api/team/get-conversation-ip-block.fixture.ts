import type { GetConversationIpBlockResponse } from "./get-conversation-ip-block";
export const getConversationIpBlockFixture = {
  ok: (overrides: Partial<GetConversationIpBlockResponse> = {}) =>
    ({
      ...{ available: false, blockedUntil: null },
      ...overrides,
    }) satisfies GetConversationIpBlockResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
