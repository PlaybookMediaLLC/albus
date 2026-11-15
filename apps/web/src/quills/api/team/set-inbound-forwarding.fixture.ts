import type { SetInboundForwardingResponse } from "./set-inbound-forwarding";
export const setInboundForwardingFixture = {
  ok: (overrides: Partial<SetInboundForwardingResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        role: "inbound",
        address: null,
        module: "support",
        inboundTrust: "strict",
        forwardingTarget: null,
        smtp: null,
        sendingDomainId: null,
        sendingDomain: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies SetInboundForwardingResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
