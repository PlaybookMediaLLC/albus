import type { StartSlackOAuthConnectResponse } from "./start-slack-oauth-connect";
export const startSlackOAuthConnectFixture = {
  ok: (overrides: Partial<StartSlackOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartSlackOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
