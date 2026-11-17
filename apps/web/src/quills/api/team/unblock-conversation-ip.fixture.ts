import type { UnblockConversationIpResponse } from "./unblock-conversation-ip";
export const unblockConversationIpFixture = {
  ok: (overrides: Partial<UnblockConversationIpResponse> = {}) =>
    ({
      ...{ available: false, blockedUntil: null },
      ...overrides,
    }) satisfies UnblockConversationIpResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
