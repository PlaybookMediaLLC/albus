import type { GetDefaultSlaPolicyResponse } from "./get-default-sla-policy";
export const getDefaultSlaPolicyFixture = {
  ok: (overrides: Partial<GetDefaultSlaPolicyResponse> = {}) =>
    ({
      ...{ policyId: null },
      ...overrides,
    }) satisfies GetDefaultSlaPolicyResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
