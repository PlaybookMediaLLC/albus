import type { GetChangelogSettingsResponse } from "./get-changelog-settings";
export const getChangelogSettingsFixture = {
  ok: (overrides: Partial<GetChangelogSettingsResponse> = {}) =>
    ({
      ...{
        audience: "public",
        collaborationDisabled: false,
        autoSubscribe: false,
        emailsDisabled: false,
        widgetAutoOpen: false,
      },
      ...overrides,
    }) satisfies GetChangelogSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
