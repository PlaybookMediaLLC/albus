import type { UpdatePortalAccessResponse } from "./update-portal-access";
export const updatePortalAccessFixture = {
  ok: (overrides: Partial<UpdatePortalAccessResponse> = {}) =>
    ({
      ...{ visibility: "public", allowedDomains: [], allowedSegmentIds: [] },
      ...overrides,
    }) satisfies UpdatePortalAccessResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
