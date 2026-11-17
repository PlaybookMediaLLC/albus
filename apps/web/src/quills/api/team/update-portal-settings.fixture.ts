import type { UpdatePortalSettingsResponse } from "./update-portal-settings";
export const updatePortalSettingsFixture = {
  ok: (overrides: Partial<UpdatePortalSettingsResponse> = {}) =>
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
        signIn: { mode: "kaneo", widgetSignIn: false, ssoUrl: null },
        receiptId: null,
      },
      ...overrides,
    }) satisfies UpdatePortalSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
