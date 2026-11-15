import type { ListFlaggedMessagesResponse } from "./list-flagged-messages";
export const listFlaggedMessagesFixture = {
  ok: (overrides: Partial<ListFlaggedMessagesResponse> = {}) =>
    ({ ...{ items: [] }, ...overrides }) satisfies ListFlaggedMessagesResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
