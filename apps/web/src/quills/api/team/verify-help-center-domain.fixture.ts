import type { VerifyHelpCenterDomainResponse } from "./verify-help-center-domain";
export const verifyHelpCenterDomainFixture = {
  ok: (overrides: Partial<VerifyHelpCenterDomainResponse> = {}) =>
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
    }) satisfies VerifyHelpCenterDomainResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
