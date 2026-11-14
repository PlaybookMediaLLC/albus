import type { StartMondayOAuthConnectResponse } from "./start-monday-oauth-connect";
export const startMondayOAuthConnectFixture = {
  ok: (overrides: Partial<StartMondayOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartMondayOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
