import type { RejectCommentResponse } from "./reject-comment";
export const rejectCommentFixture = {
  ok: (overrides: Partial<RejectCommentResponse> = {}) =>
    ({ ...{ id: "id_test_1" }, ...overrides }) satisfies RejectCommentResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
