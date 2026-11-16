import type { UnlinkPostFromConversationResponse } from "./unlink-post-from-conversation";
export const unlinkPostFromConversationFixture = {
  ok: (overrides: Partial<UnlinkPostFromConversationResponse> = {}) =>
    ({
      ...{ changed: false },
      ...overrides,
    }) satisfies UnlinkPostFromConversationResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
