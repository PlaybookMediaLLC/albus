import type { DeleteChangelogCategoryResponse } from "./delete-changelog-category";
export const deleteChangelogCategoryFixture = {
  ok: (overrides: Partial<DeleteChangelogCategoryResponse> = {}) =>
    ({
      ...{ id: "id_test_1" },
      ...overrides,
    }) satisfies DeleteChangelogCategoryResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
