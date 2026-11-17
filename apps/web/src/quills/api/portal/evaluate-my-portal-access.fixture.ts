import type { EvaluateMyPortalAccessResponse } from "./evaluate-my-portal-access";
export const evaluateMyPortalAccessFixture = {
  ok: (overrides: Partial<EvaluateMyPortalAccessResponse> = {}) =>
    ({
      ...{
        granted: false,
        reason: "public",
        signIn: { mode: "kaneo", ssoUrl: null },
      },
      ...overrides,
    }) satisfies EvaluateMyPortalAccessResponse,
  problem: (status: 403 | 404) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
