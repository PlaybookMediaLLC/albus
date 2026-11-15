import type { UpdateDeveloperSettingsResponse } from "./update-developer-settings";
export const updateDeveloperSettingsFixture = {
  ok: (overrides: Partial<UpdateDeveloperSettingsResponse> = {}) =>
    ({
      ...{
        mcpEnabled: false,
        mcpPortalAccessEnabled: false,
        oauthDynamicClientRegistrationEnabled: false,
        personalApiKeysEnabled: false,
        receiptId: null,
      },
      ...overrides,
    }) satisfies UpdateDeveloperSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
