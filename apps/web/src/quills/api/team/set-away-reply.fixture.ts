import type { SetAwayReplyResponse } from "./set-away-reply";
export const setAwayReplyFixture = {
  ok: (overrides: Partial<SetAwayReplyResponse> = {}) =>
    ({
      ...{ enabled: false, message: "value" },
      ...overrides,
    }) satisfies SetAwayReplyResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
