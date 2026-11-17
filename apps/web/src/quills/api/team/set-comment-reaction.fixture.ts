import type { SetCommentReactionResponse } from "./set-comment-reaction";
export const setCommentReactionFixture = {
  ok: (overrides: Partial<SetCommentReactionResponse> = {}) =>
    ({
      ...{ changed: false, reactions: [] },
      ...overrides,
    }) satisfies SetCommentReactionResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
