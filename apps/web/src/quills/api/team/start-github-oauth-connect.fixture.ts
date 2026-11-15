import type { StartGithubOAuthConnectResponse } from "./start-github-oauth-connect";
export const startGithubOAuthConnectFixture = {
  ok: (overrides: Partial<StartGithubOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartGithubOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
