import type { SetPostVisibilityResponse } from "./set-post-visibility";
export const setPostVisibilityFixture = {
  ok: (overrides: Partial<SetPostVisibilityResponse> = {}) =>
    ({
      ...{ id: "id_test_1", moderationState: "value", isHidden: false },
      ...overrides,
    }) satisfies SetPostVisibilityResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
