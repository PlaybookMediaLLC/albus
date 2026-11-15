import type { DeleteBoardResponse } from "./delete-board";
export const deleteBoardFixture = {
  ok: (overrides: Partial<DeleteBoardResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        deletedAt: "2026-01-01T00:00:00.000Z",
        unmerged: [],
      },
      ...overrides,
    }) satisfies DeleteBoardResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
