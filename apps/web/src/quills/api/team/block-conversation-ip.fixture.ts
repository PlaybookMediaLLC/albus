import type { BlockConversationIpResponse } from "./block-conversation-ip";
export const blockConversationIpFixture = {
  ok: (overrides: Partial<BlockConversationIpResponse> = {}) =>
    ({
      ...{ available: false, blockedUntil: null },
      ...overrides,
    }) satisfies BlockConversationIpResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
