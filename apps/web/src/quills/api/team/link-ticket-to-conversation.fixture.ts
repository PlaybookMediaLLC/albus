import type { LinkTicketToConversationResponse } from "./link-ticket-to-conversation";
export const linkTicketToConversationFixture = {
  ok: (overrides: Partial<LinkTicketToConversationResponse> = {}) =>
    ({
      ...{ changed: false },
      ...overrides,
    }) satisfies LinkTicketToConversationResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
