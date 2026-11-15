import type { StartNotionOAuthConnectResponse } from "./start-notion-oauth-connect";
export const startNotionOAuthConnectFixture = {
  ok: (overrides: Partial<StartNotionOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartNotionOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
