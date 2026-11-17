import type { SendPostUpdateResponse } from "./send-post-update";
export const sendPostUpdateFixture = {
  ok: (overrides: Partial<SendPostUpdateResponse> = {}) =>
    ({
      ...{
        updateId: "update_id_test_1",
        counts: {
          page: 0,
          email: 0,
          emailEstimated: false,
          conversations: 0,
          slack: 0,
        },
        replayed: false,
        commentId: null,
        replies: [],
      },
      ...overrides,
    }) satisfies SendPostUpdateResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
