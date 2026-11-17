import type { ListPostTasksResponse } from "./list-post-tasks";
export const listPostTasksFixture = {
  ok: (overrides: Partial<ListPostTasksResponse> = {}) =>
    ({
      ...{ items: [], hidden: 0 },
      ...overrides,
    }) satisfies ListPostTasksResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
