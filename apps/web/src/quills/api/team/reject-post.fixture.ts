import type { RejectPostResponse } from "./reject-post";
export const rejectPostFixture = {
  ok: (overrides: Partial<RejectPostResponse> = {}) =>
    ({ ...{ id: "id_test_1" }, ...overrides }) satisfies RejectPostResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
