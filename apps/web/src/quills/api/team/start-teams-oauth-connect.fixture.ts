import type { StartTeamsOAuthConnectResponse } from "./start-teams-oauth-connect";
export const startTeamsOAuthConnectFixture = {
  ok: (overrides: Partial<StartTeamsOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartTeamsOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
