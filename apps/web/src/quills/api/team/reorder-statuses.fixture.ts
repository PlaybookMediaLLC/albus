import type { ReorderStatusesResponse } from "./reorder-statuses";
export const reorderStatusesFixture = {
  ok: (overrides: Partial<ReorderStatusesResponse> = {}) =>
    ({ ...{ statusIds: [] }, ...overrides }) satisfies ReorderStatusesResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
