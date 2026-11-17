import type { ListChangelogTranslationsResponse } from "./list-changelog-translations";
export const listChangelogTranslationsFixture = {
  ok: (overrides: Partial<ListChangelogTranslationsResponse> = {}) =>
    ({
      ...{ items: [] },
      ...overrides,
    }) satisfies ListChangelogTranslationsResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
