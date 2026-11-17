import type { GetPortalSettingsResponse } from "./get-portal-settings";
export const getPortalSettingsFixture = {
  ok: (overrides: Partial<GetPortalSettingsResponse> = {}) =>
    ({
      ...{
        enabled: false,
        features: {
          allowAnonymous: false,
          allowEditAfterEngagement: false,
          allowDeleteAfterEngagement: false,
          showPublicEditHistory: false,
        },
        openSignup: null,
        moderationDefault: {
          requireApproval: "value",
          holdImages: false,
          holdLinks: false,
          holdSpam: false,
          holdSensitive: false,
        },
        access: {
          visibility: "value",
          allowedDomains: [],
          widgetSignIn: false,
          allowedSegmentIds: [],
        },
        nav: [],
        supportEnabled: false,
        signIn: { mode: "account", widgetSignIn: false, ssoUrl: null },
      },
      ...overrides,
    }) satisfies GetPortalSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
