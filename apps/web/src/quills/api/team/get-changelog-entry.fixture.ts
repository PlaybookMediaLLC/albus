import type { GetChangelogEntryResponse } from "./get-changelog-entry";
export const getChangelogEntryFixture = {
  ok: (overrides: Partial<GetChangelogEntryResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        title: "value",
        content: "value",
        status: "draft",
        publishedAt: null,
        displayDate: null,
        segmentIds: [],
        viewCount: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        author: null,
        linkedPosts: [],
        categories: [],
      },
      ...overrides,
    }) satisfies GetChangelogEntryResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
