import type { SetPortalDomainResponse } from "./set-portal-domain";
export const setPortalDomainFixture = {
  ok: (overrides: Partial<SetPortalDomainResponse> = {}) =>
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
    }) satisfies SetPortalDomainResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
