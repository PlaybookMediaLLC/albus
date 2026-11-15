import type { SaveWidgetHeroImageKeyResponse } from "./save-widget-hero-image-key";
export const saveWidgetHeroImageKeyFixture = {
  ok: (overrides: Partial<SaveWidgetHeroImageKeyResponse> = {}) =>
    ({
      ...{ changed: false },
      ...overrides,
    }) satisfies SaveWidgetHeroImageKeyResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
