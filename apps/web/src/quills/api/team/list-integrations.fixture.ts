import type { ListIntegrationsResponse } from "./list-integrations";
export const listIntegrationsFixture = {
  ok: (overrides: Partial<ListIntegrationsResponse> = {}) =>
    ({
      ...{ integrations: [] },
      ...overrides,
    }) satisfies ListIntegrationsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
