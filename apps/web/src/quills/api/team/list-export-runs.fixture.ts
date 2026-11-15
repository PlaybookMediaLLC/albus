import type { ListExportRunsResponse } from "./list-export-runs";
export const listExportRunsFixture = {
  ok: (overrides: Partial<ListExportRunsResponse> = {}) =>
    ({ ...{ items: [] }, ...overrides }) satisfies ListExportRunsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
