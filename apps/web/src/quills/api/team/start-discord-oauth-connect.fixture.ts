import type { StartDiscordOAuthConnectResponse } from "./start-discord-oauth-connect";
export const startDiscordOAuthConnectFixture = {
  ok: (overrides: Partial<StartDiscordOAuthConnectResponse> = {}) =>
    ({
      ...{ authorizeUrl: "value" },
      ...overrides,
    }) satisfies StartDiscordOAuthConnectResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
