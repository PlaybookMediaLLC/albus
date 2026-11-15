import type { StartGitlabOAuthConnectResponse } from "./start-gitlab-oauth-connect";
export const startGitlabOAuthConnectFixture = {
  ok: (overrides: Partial<StartGitlabOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartGitlabOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
