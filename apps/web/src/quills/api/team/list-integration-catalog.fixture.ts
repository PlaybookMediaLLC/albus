import type { ListIntegrationCatalogResponse } from "./list-integration-catalog";
export const listIntegrationCatalogFixture = {
  ok: (overrides: Partial<ListIntegrationCatalogResponse> = {}) =>
    ({
      ...{ providers: [] },
      ...overrides,
    }) satisfies ListIntegrationCatalogResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
