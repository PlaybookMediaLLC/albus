import type { GetModerationStatusResponse } from "./get-moderation-status";
export const getModerationStatusFixture = {
  ok: (overrides: Partial<GetModerationStatusResponse> = {}) =>
    ({
      ...{ enabled: false, pendingCount: 0 },
      ...overrides,
    }) satisfies GetModerationStatusResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
