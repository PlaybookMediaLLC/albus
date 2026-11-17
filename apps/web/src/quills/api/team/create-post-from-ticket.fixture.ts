import type { CreatePostFromTicketResponse } from "./create-post-from-ticket";
export const createPostFromTicketFixture = {
  ok: (overrides: Partial<CreatePostFromTicketResponse> = {}) =>
    ({
      ...{ postId: "post_id_test_1", created: false, voted: false },
      ...overrides,
    }) satisfies CreatePostFromTicketResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
