import type { StartHubspotOAuthConnectResponse } from "./start-hubspot-oauth-connect";
export const startHubspotOAuthConnectFixture = {
  ok: (overrides: Partial<StartHubspotOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartHubspotOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
