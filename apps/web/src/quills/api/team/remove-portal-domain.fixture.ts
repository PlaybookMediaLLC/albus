import type { RemovePortalDomainResponse } from "./remove-portal-domain";
export const removePortalDomainFixture = {
  ok: (overrides: Partial<RemovePortalDomainResponse> = {}) =>
    ({
      ...{ removed: false, domain: null },
      ...overrides,
    }) satisfies RemovePortalDomainResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
