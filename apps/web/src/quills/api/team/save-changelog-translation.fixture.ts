import type { SaveChangelogTranslationResponse } from "./save-changelog-translation";
export const saveChangelogTranslationFixture = {
  ok: (overrides: Partial<SaveChangelogTranslationResponse> = {}) =>
    ({
      ...{
        locale: "value",
        title: "value",
        content: "value",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies SaveChangelogTranslationResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
