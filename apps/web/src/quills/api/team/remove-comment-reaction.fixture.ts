import type { RemoveCommentReactionResponse } from "./remove-comment-reaction";
export const removeCommentReactionFixture = {
  ok: (overrides: Partial<RemoveCommentReactionResponse> = {}) =>
    ({
      ...{ changed: false, reactions: [] },
      ...overrides,
    }) satisfies RemoveCommentReactionResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
