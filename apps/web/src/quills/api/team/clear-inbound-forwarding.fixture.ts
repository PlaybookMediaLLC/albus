import type { ClearInboundForwardingResponse } from "./clear-inbound-forwarding";
export const clearInboundForwardingFixture = {
  // The API answers null when there is no inbound route. This is the route after a clear.
  ok: (overrides: Partial<NonNullable<ClearInboundForwardingResponse>> = {}) =>
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
    }) satisfies ClearInboundForwardingResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
