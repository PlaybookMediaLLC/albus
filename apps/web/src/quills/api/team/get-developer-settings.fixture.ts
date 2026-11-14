import type { GetDeveloperSettingsResponse } from "./get-developer-settings";
export const getDeveloperSettingsFixture = {
  ok: (overrides: Partial<GetDeveloperSettingsResponse> = {}) =>
    ({
      ...{
        mcpEnabled: false,
        mcpPortalAccessEnabled: false,
        oauthDynamicClientRegistrationEnabled: false,
        personalApiKeysEnabled: false,
      },
      ...overrides,
    }) satisfies GetDeveloperSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
