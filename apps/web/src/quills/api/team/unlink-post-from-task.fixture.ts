import type { UnlinkPostFromTaskResponse } from "./unlink-post-from-task";
export const unlinkPostFromTaskFixture = {
  ok: (overrides: Partial<UnlinkPostFromTaskResponse> = {}) =>
    ({
      ...{ changed: false },
      ...overrides,
    }) satisfies UnlinkPostFromTaskResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
