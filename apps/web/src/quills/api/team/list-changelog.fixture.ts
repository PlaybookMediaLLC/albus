import type { ListChangelogResponse } from "./list-changelog";
export const listChangelogFixture = {
  ok: (overrides: Partial<ListChangelogResponse> = {}) =>
    ({
      ...{ entries: [], nextCursor: null, hasMore: false },
      ...overrides,
    }) satisfies ListChangelogResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
