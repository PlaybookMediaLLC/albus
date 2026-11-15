import type { UpdateChangelogCategoryResponse } from "./update-changelog-category";
export const updateChangelogCategoryFixture = {
  ok: (overrides: Partial<UpdateChangelogCategoryResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        color: "value",
        segmentIds: [],
        position: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies UpdateChangelogCategoryResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
