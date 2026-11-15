import type { StartSalesforceOAuthConnectResponse } from "./start-salesforce-oauth-connect";
export const startSalesforceOAuthConnectFixture = {
  ok: (overrides: Partial<StartSalesforceOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartSalesforceOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
