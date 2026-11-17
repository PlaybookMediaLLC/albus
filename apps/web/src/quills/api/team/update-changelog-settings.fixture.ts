import type { UpdateChangelogSettingsResponse } from "./update-changelog-settings";
export const updateChangelogSettingsFixture = {
  ok: (overrides: Partial<UpdateChangelogSettingsResponse> = {}) =>
    ({
      ...{
        audience: "public",
        collaborationDisabled: false,
        autoSubscribe: false,
        emailsDisabled: false,
        widgetAutoOpen: false,
      },
      ...overrides,
    }) satisfies UpdateChangelogSettingsResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
