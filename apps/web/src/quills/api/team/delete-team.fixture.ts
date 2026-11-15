import type { DeleteTeamResponse } from "./delete-team";
export const deleteTeamFixture = {
  ok: (overrides: Partial<DeleteTeamResponse> = {}) =>
    ({ ...{ id: "id_test_1" }, ...overrides }) satisfies DeleteTeamResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
