import type { UpdateTagResponse } from "./update-tag";
export const updateTagFixture = {
  ok: (overrides: Partial<UpdateTagResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        color: "value",
        description: null,
        aiPrompt: null,
        isPublic: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies UpdateTagResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
