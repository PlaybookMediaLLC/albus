import type { MintWidgetInstallCodeResponse } from "./mint-widget-install-code";
export const mintWidgetInstallCodeFixture = {
  ok: (overrides: Partial<MintWidgetInstallCodeResponse> = {}) =>
    ({
      ...{ code: "value", expiresAt: "2026-01-01T00:00:00.000Z" },
      ...overrides,
    }) satisfies MintWidgetInstallCodeResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
