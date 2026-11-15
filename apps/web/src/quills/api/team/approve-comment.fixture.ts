import type { ApproveCommentResponse } from "./approve-comment";
export const approveCommentFixture = {
  ok: (overrides: Partial<ApproveCommentResponse> = {}) =>
    ({ ...{ id: "id_test_1" }, ...overrides }) satisfies ApproveCommentResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
