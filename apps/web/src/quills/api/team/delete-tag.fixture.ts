import type { DeleteTagResponse } from "./delete-tag";
export const deleteTagFixture = {
  ok: (overrides: Partial<DeleteTagResponse> = {}) =>
    ({ ...{ id: "id_test_1" }, ...overrides }) satisfies DeleteTagResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
