import type { DeleteChangelogEntryResponse } from "./delete-changelog-entry";
export const deleteChangelogEntryFixture = {
  ok: (overrides: Partial<DeleteChangelogEntryResponse> = {}) =>
    ({
      ...{ id: "id_test_1" },
      ...overrides,
    }) satisfies DeleteChangelogEntryResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
