import type { CreateImportResponse } from "./create-import";
export const createImportFixture = {
  ok: (overrides: Partial<CreateImportResponse> = {}) =>
    ({
      ...{
        runId: "run_id_test_1",
        status: "pending",
        fileId: "file_id_test_1",
      },
      ...overrides,
    }) satisfies CreateImportResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
