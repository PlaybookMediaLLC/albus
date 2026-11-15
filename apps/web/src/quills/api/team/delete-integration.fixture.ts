import type { DeleteIntegrationResponse } from "./delete-integration";
export const deleteIntegrationFixture = {
  ok: (overrides: Partial<DeleteIntegrationResponse> = {}) =>
    ({
      ...{ deleted: false },
      ...overrides,
    }) satisfies DeleteIntegrationResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
