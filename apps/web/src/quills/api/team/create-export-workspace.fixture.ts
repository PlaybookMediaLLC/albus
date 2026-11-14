import type { CreateExportWorkspaceResponse } from "./create-export-workspace";
export const createExportWorkspaceFixture = {
  ok: (overrides: Partial<CreateExportWorkspaceResponse> = {}) =>
    ({
      ...{ runId: "run_id_test_1" },
      ...overrides,
    }) satisfies CreateExportWorkspaceResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
