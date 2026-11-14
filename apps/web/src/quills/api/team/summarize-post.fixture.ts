import type { SummarizePostResponse } from "./summarize-post";
export const summarizePostFixture = {
  ok: (overrides: Partial<SummarizePostResponse> = {}) =>
    ({
      ...{ postId: "post_id_test_1", summary: "value" },
      ...overrides,
    }) satisfies SummarizePostResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429 | 502) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
