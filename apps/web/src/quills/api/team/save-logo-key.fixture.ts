import type { SaveLogoKeyResponse } from "./save-logo-key";
export const saveLogoKeyFixture = {
  ok: (overrides: Partial<SaveLogoKeyResponse> = {}) =>
    ({ ...{ changed: false }, ...overrides }) satisfies SaveLogoKeyResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
