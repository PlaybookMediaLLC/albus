import type { SaveCustomerAvatarResponse } from "./save-customer-avatar";
export const saveCustomerAvatarFixture = {
  ok: (overrides: Partial<SaveCustomerAvatarResponse> = {}) =>
    ({
      ...{ changed: false, principalId: null, avatarUrl: null },
      ...overrides,
    }) satisfies SaveCustomerAvatarResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
