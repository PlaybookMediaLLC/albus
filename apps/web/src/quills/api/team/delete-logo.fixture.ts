import type { DeleteLogoResponse } from "./delete-logo";
export const deleteLogoFixture = {
  ok: (overrides: Partial<DeleteLogoResponse> = {}) =>
    ({ ...{ changed: false }, ...overrides }) satisfies DeleteLogoResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
