import type { SetCommentPinResponse } from "./set-comment-pin";
export const setCommentPinFixture = {
  ok: (overrides: Partial<SetCommentPinResponse> = {}) =>
    ({ ...{ changed: false }, ...overrides }) satisfies SetCommentPinResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
