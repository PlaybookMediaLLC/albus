import type { GetPortalWidgetLinkResponse } from "./get-portal-widget-link";
export const getPortalWidgetLinkFixture = {
  ok: (overrides: Partial<GetPortalWidgetLinkResponse> = {}) =>
    ({
      ...{ pending: false },
      ...overrides,
    }) satisfies GetPortalWidgetLinkResponse,
  problem: (status: 401 | 403 | 404) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
