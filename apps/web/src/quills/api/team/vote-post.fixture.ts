import type { VotePostResponse } from "./vote-post";
export const votePostFixture = {
  ok: (overrides: Partial<VotePostResponse> = {}) =>
    ({
      ...{ postId: "post_id_test_1", changed: false, voteCount: 0 },
      ...overrides,
    }) satisfies VotePostResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
