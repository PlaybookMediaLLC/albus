import type { UpdateBrandingSettingsResponse } from "./update-branding-settings";
export const updateBrandingSettingsFixture = {
  ok: (overrides: Partial<UpdateBrandingSettingsResponse> = {}) =>
    ({
      ...{
        theme: {},
        customCss: "value",
        headerDisplayMode: "value",
        headerDisplayName: null,
        receiptId: null,
      },
      ...overrides,
    }) satisfies UpdateBrandingSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
