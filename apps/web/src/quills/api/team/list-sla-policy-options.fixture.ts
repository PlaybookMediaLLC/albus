import type { ListSlaPolicyOptionsResponse } from "./list-sla-policy-options";
export const listSlaPolicyOptionsFixture = {
  ok: (overrides: Partial<ListSlaPolicyOptionsResponse> = {}) =>
    ({ ...{ items: [] }, ...overrides }) satisfies ListSlaPolicyOptionsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
