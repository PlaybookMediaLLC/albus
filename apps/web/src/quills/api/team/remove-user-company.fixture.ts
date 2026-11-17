import type { RemoveUserCompanyResponse } from "./remove-user-company";
export const removeUserCompanyFixture = {
  ok: (overrides: Partial<RemoveUserCompanyResponse> = {}) =>
    ({
      ...{ removed: false },
      ...overrides,
    }) satisfies RemoveUserCompanyResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
