import type { ListExportRunsDownloadResponse } from "./list-export-runs-download";
export const listExportRunsDownloadFixture = {
  ok: (overrides: Partial<ListExportRunsDownloadResponse> = {}) =>
    ({
      ...{
        fileName: "value",
        downloadUrl: "value",
        downloadExpiresAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies ListExportRunsDownloadResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
