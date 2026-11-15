import type { StartJiraOAuthConnectResponse } from "./start-jira-oauth-connect";
export const startJiraOAuthConnectFixture = {
  ok: (overrides: Partial<StartJiraOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartJiraOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
