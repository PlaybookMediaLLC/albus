import type { SetHelpCenterDomainResponse } from "./set-help-center-domain";
export const setHelpCenterDomainFixture = {
  ok: (overrides: Partial<SetHelpCenterDomainResponse> = {}) =>
    ({
      ...{
        changed: false,
        domain: {
          kind: "portal",
          domain: "value",
          active: false,
          verifiedAt: null,
          checkedAt: null,
          checkResult: "verified",
          record: { type: "TXT", name: "value", value: "value" },
        },
      },
      ...overrides,
    }) satisfies SetHelpCenterDomainResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
