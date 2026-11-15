import type { SetDefaultSlaPolicyResponse } from "./set-default-sla-policy";
export const setDefaultSlaPolicyFixture = {
  ok: (overrides: Partial<SetDefaultSlaPolicyResponse> = {}) =>
    ({
      ...{ policyId: null },
      ...overrides,
    }) satisfies SetDefaultSlaPolicyResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
