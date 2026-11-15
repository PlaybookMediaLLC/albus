import type { ListUserAttributesResponse } from "./list-user-attributes";
export const listUserAttributesFixture = {
  ok: (overrides: Partial<ListUserAttributesResponse> = {}) =>
    ({
      ...{ attributes: [] },
      ...overrides,
    }) satisfies ListUserAttributesResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
