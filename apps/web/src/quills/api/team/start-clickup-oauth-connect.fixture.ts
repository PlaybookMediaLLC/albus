import type { StartClickupOAuthConnectResponse } from "./start-clickup-oauth-connect";
export const startClickupOAuthConnectFixture = {
  ok: (overrides: Partial<StartClickupOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartClickupOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
