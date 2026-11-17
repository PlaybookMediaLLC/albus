import type { GetFileResponse } from "./get-file";
export const getFileFixture = {
  ok: (overrides: Partial<GetFileResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        contentType: "value",
        size: 0,
        family: "value",
        createdAt: "2026-01-01T00:00:00.000Z",
        downloadUrl: "value",
        downloadExpiresAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies GetFileResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
