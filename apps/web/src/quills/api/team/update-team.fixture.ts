import type { UpdateTeamResponse } from "./update-team";
export const updateTeamFixture = {
  ok: (overrides: Partial<UpdateTeamResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        kaneoTeamId: null,
        isDefault: false,
        icon: null,
        color: null,
        description: null,
        assignmentMethod: "value",
      },
      ...overrides,
    }) satisfies UpdateTeamResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
