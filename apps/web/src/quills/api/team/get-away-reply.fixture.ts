import type { GetAwayReplyResponse } from "./get-away-reply";
export const getAwayReplyFixture = {
  ok: (overrides: Partial<GetAwayReplyResponse> = {}) =>
    ({
      ...{ enabled: false, message: "value" },
      ...overrides,
    }) satisfies GetAwayReplyResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
