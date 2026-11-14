import type { WipeWorkspaceDataResponse } from "./wipe-workspace-data";
export const wipeWorkspaceDataFixture = {
  ok: (overrides: Partial<WipeWorkspaceDataResponse> = {}) =>
    ({
      ...{ queued: false },
      ...overrides,
    }) satisfies WipeWorkspaceDataResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
