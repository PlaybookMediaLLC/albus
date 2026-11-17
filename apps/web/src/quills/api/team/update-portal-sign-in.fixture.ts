import type { UpdatePortalSignInResponse } from "./update-portal-sign-in";
export const updatePortalSignInFixture = {
  ok: (overrides: Partial<UpdatePortalSignInResponse> = {}) =>
    ({
      ...{ mode: "kaneo", widgetSignIn: false, ssoUrl: null },
      ...overrides,
    }) satisfies UpdatePortalSignInResponse,
  problem: (status: 400 | 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
