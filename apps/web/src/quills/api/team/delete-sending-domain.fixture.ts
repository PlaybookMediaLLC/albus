import type { DeleteSendingDomainResponse } from "./delete-sending-domain";
export const deleteSendingDomainFixture = {
  ok: (overrides: Partial<DeleteSendingDomainResponse> = {}) =>
    ({
      ...{ id: "id_test_1" },
      ...overrides,
    }) satisfies DeleteSendingDomainResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
