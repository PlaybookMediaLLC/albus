import type { DeleteChannelAccountResponse } from "./delete-channel-account";
export const deleteChannelAccountFixture = {
  ok: (overrides: Partial<DeleteChannelAccountResponse> = {}) =>
    ({
      ...{ id: "id_test_1", lastOnDomain: null },
      ...overrides,
    }) satisfies DeleteChannelAccountResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
