import type { ListChangelogCategoriesResponse } from "./list-changelog-categories";
export const listChangelogCategoriesFixture = {
  ok: (overrides: Partial<ListChangelogCategoriesResponse> = {}) =>
    ({
      ...{ categories: [], nextOffset: null },
      ...overrides,
    }) satisfies ListChangelogCategoriesResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
