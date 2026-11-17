import type { LinkPortalWidgetProfileResponse } from "./link-portal-widget-profile";
export const linkPortalWidgetProfileFixture = {
  ok: (overrides: Partial<LinkPortalWidgetProfileResponse> = {}) =>
    ({
      principalId: "principal_test_1",
      mergedPrincipalId: "principal_test_2",
      ...overrides,
    }) satisfies LinkPortalWidgetProfileResponse,
};
