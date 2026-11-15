import type { CreateTagResponse } from "./create-tag";
export const createTagFixture = {
  ok: (overrides: Partial<CreateTagResponse> = {}) =>
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
    }) satisfies CreateTagResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
