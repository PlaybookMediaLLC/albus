import type { CreatePostViewResponse } from "./create-post-view";
export const createPostViewFixture = {
  ok: (overrides: Partial<CreatePostViewResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        isShared: false,
        mine: false,
        filters: {},
      },
      ...overrides,
    }) satisfies CreatePostViewResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
