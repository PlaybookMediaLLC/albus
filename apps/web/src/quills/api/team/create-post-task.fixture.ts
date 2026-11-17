import type { CreatePostTaskResponse } from "./create-post-task";
export const createPostTaskFixture = {
  ok: (overrides: Partial<CreatePostTaskResponse> = {}) =>
    ({
      ...{ taskId: "task_id_test_1", projectId: "project_id_test_1" },
      ...overrides,
    }) satisfies CreatePostTaskResponse,
  problem: (status: 400 | 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
