import type { DeleteUserResponse } from "./delete-user";
export const deleteUserFixture = {
  ok: (overrides: Partial<DeleteUserResponse> = {}) =>
    ({
      ...{ principalId: "principal_id_test_1" },
      ...overrides,
    }) satisfies DeleteUserResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
