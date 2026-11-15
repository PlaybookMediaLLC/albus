import type { StartTrelloOAuthConnectResponse } from "./start-trello-oauth-connect";
export const startTrelloOAuthConnectFixture = {
  ok: (overrides: Partial<StartTrelloOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartTrelloOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
