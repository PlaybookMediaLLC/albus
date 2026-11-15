import type { RemoveHelpCenterDomainResponse } from "./remove-help-center-domain";
export const removeHelpCenterDomainFixture = {
  ok: (overrides: Partial<RemoveHelpCenterDomainResponse> = {}) =>
    ({
      ...{ removed: false, domain: null },
      ...overrides,
    }) satisfies RemoveHelpCenterDomainResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
