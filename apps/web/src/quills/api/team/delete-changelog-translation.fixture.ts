import type { DeleteChangelogTranslationResponse } from "./delete-changelog-translation";
export const deleteChangelogTranslationFixture = {
  ok: (overrides: Partial<DeleteChangelogTranslationResponse> = {}) =>
    ({
      ...{ deleted: true },
      ...overrides,
    }) satisfies DeleteChangelogTranslationResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
