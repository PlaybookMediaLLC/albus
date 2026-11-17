import type { RemoveCommentPinResponse } from "./remove-comment-pin";
export const removeCommentPinFixture = {
  ok: (overrides: Partial<RemoveCommentPinResponse> = {}) =>
    ({
      ...{ changed: false },
      ...overrides,
    }) satisfies RemoveCommentPinResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
