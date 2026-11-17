import type { ListPostViewsResponse } from "./list-post-views";
export const listPostViewsFixture = {
  ok: (overrides: Partial<ListPostViewsResponse> = {}) =>
    ({
      ...{ views: [], nextOffset: null },
      ...overrides,
    }) satisfies ListPostViewsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
