import type { CreateFilesResponse } from "./create-files";
export const createFilesFixture = {
  ok: (overrides: Partial<CreateFilesResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        contentType: "value",
        size: 0,
        family: "value",
        createdAt: "2026-01-01T00:00:00.000Z",
        created: false,
      },
      ...overrides,
    }) satisfies CreateFilesResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
