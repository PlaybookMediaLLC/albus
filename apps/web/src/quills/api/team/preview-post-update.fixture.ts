import type { PreviewPostUpdateResponse } from "./preview-post-update";
export const previewPostUpdateFixture = {
  ok: (overrides: Partial<PreviewPostUpdateResponse> = {}) =>
    ({
      ...{
        counts: {
          page: 0,
          email: 0,
          emailEstimated: false,
          conversations: 0,
          slack: 0,
        },
        slackConnected: false,
      },
      ...overrides,
    }) satisfies PreviewPostUpdateResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
