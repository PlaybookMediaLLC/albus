import type { LinkPostToTaskResponse } from "./link-post-to-task";
export const linkPostToTaskFixture = {
  ok: (overrides: Partial<LinkPostToTaskResponse> = {}) =>
    ({ ...{ changed: false }, ...overrides }) satisfies LinkPostToTaskResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
