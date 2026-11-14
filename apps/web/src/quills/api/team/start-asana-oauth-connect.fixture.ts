import type { StartAsanaOAuthConnectResponse } from "./start-asana-oauth-connect";
export const startAsanaOAuthConnectFixture = {
  ok: (overrides: Partial<StartAsanaOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartAsanaOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
