import type { CreateChangelogEntryResponse } from "./create-changelog-entry";
export const createChangelogEntryFixture = {
  ok: (overrides: Partial<CreateChangelogEntryResponse> = {}) =>
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
        publishedNow: false,
      },
      ...overrides,
    }) satisfies CreateChangelogEntryResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
