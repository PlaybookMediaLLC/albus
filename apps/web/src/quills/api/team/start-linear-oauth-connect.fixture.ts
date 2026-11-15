import type { StartLinearOAuthConnectResponse } from "./start-linear-oauth-connect";
export const startLinearOAuthConnectFixture = {
  ok: (overrides: Partial<StartLinearOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartLinearOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
