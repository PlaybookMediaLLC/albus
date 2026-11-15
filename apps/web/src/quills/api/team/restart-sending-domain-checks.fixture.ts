import type { RestartSendingDomainChecksResponse } from "./restart-sending-domain-checks";
export const restartSendingDomainChecksFixture = {
  ok: (overrides: Partial<RestartSendingDomainChecksResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        domain: "value",
        status: "pending",
        dnsRecords: [],
        verifiedAt: null,
        mailFromLabel: "value",
        dkimMode: "easy",
        signingKeyPending: false,
        autoCheckUntil: null,
        lastCheckedAt: null,
      },
      ...overrides,
    }) satisfies RestartSendingDomainChecksResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
