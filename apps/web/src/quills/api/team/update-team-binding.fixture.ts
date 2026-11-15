import type { UpdateTeamBindingResponse } from "./update-team-binding";
export const updateTeamBindingFixture = {
  ok: (overrides: Partial<UpdateTeamBindingResponse> = {}) =>
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
    }) satisfies UpdateTeamBindingResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
