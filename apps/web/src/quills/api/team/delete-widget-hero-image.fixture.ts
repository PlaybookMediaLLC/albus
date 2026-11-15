import type { DeleteWidgetHeroImageResponse } from "./delete-widget-hero-image";
export const deleteWidgetHeroImageFixture = {
  ok: (overrides: Partial<DeleteWidgetHeroImageResponse> = {}) =>
    ({
      ...{ changed: false },
      ...overrides,
    }) satisfies DeleteWidgetHeroImageResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
