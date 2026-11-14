import type { StartIntercomOAuthConnectResponse } from "./start-intercom-oauth-connect";
export const startIntercomOAuthConnectFixture = {
  ok: (overrides: Partial<StartIntercomOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartIntercomOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
