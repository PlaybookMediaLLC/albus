import type { ListUserCommentsResponse } from "./list-user-comments";
export const listUserCommentsFixture = {
  ok: (overrides: Partial<ListUserCommentsResponse> = {}) =>
    ({
      ...{ items: [], nextCursor: null, hasMore: false },
      ...overrides,
    }) satisfies ListUserCommentsResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
