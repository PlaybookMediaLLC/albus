import type { SetPostFactorScoresResponse } from "./set-post-factor-scores";
export const setPostFactorScoresFixture = {
  ok: (overrides: Partial<SetPostFactorScoresResponse> = {}) =>
    ({
      ...{ postId: "post_id_test_1", values: [], score: null },
      ...overrides,
    }) satisfies SetPostFactorScoresResponse,
  problem: (status: 400 | 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
