import type { LinkPortalWidgetProfileResponse } from "./link-portal-widget-profile";
export const linkPortalWidgetProfileFixture = {
  ok: (overrides: Partial<LinkPortalWidgetProfileResponse> = {}) =>
    ({
      ...{ principalId: null, mergedPrincipalId: null },
      ...overrides,
    }) satisfies LinkPortalWidgetProfileResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
