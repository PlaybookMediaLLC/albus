import type { ListPendingModerationResponse } from "./list-pending-moderation";
export const listPendingModerationFixture = {
  ok: (overrides: Partial<ListPendingModerationResponse> = {}) =>
    ({
      ...{ posts: [], comments: [], nextOffset: null },
      ...overrides,
    }) satisfies ListPendingModerationResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
