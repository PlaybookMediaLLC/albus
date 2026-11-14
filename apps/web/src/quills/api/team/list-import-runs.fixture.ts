import type { ListImportRunsResponse } from "./list-import-runs";
export const listImportRunsFixture = {
  ok: (overrides: Partial<ListImportRunsResponse> = {}) =>
    ({ ...{ items: [] }, ...overrides }) satisfies ListImportRunsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
