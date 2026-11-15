import type { ApprovePostResponse } from "./approve-post";
export const approvePostFixture = {
  ok: (overrides: Partial<ApprovePostResponse> = {}) =>
    ({ ...{ id: "id_test_1" }, ...overrides }) satisfies ApprovePostResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
