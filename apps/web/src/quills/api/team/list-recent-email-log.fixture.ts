import type { ListRecentEmailLogResponse } from "./list-recent-email-log";
export const listRecentEmailLogFixture = {
  ok: (overrides: Partial<ListRecentEmailLogResponse> = {}) =>
    ({ ...{ items: [] }, ...overrides }) satisfies ListRecentEmailLogResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
