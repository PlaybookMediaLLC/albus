import type { DeleteCustomerAvatarResponse } from "./delete-customer-avatar";
export const deleteCustomerAvatarFixture = {
  ok: (overrides: Partial<DeleteCustomerAvatarResponse> = {}) =>
    ({
      ...{ changed: false, principalId: null, avatarUrl: null },
      ...overrides,
    }) satisfies DeleteCustomerAvatarResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
