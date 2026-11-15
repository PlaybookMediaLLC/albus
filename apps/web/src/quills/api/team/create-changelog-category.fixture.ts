import type { CreateChangelogCategoryResponse } from "./create-changelog-category";
export const createChangelogCategoryFixture = {
  ok: (overrides: Partial<CreateChangelogCategoryResponse> = {}) =>
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
    }) satisfies CreateChangelogCategoryResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
