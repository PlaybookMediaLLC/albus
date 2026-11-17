import type { DeclinePortalWidgetLinkResponse } from "./decline-portal-widget-link";
export const declinePortalWidgetLinkFixture = {
  ok: (overrides: Partial<DeclinePortalWidgetLinkResponse> = {}) =>
    ({
      ...{ declined: false },
      ...overrides,
    }) satisfies DeclinePortalWidgetLinkResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
