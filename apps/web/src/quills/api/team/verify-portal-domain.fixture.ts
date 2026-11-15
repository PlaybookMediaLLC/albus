import type { VerifyPortalDomainResponse } from "./verify-portal-domain";
export const verifyPortalDomainFixture = {
  ok: (overrides: Partial<VerifyPortalDomainResponse> = {}) =>
    ({
      ...{
        kind: "portal",
        domain: "value",
        active: false,
        verifiedAt: null,
        checkedAt: null,
        checkResult: "verified",
        record: { type: "TXT", name: "value", value: "value" },
      },
      ...overrides,
    }) satisfies VerifyPortalDomainResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
