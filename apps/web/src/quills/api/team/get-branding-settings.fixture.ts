import type { GetBrandingSettingsResponse } from "./get-branding-settings";
export const getBrandingSettingsFixture = {
  ok: (overrides: Partial<GetBrandingSettingsResponse> = {}) =>
    ({
      ...{
        theme: {},
        customCss: "value",
        headerDisplayMode: "value",
        headerDisplayName: null,
      },
      ...overrides,
    }) satisfies GetBrandingSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
