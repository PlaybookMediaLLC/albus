import type { ImportCompaniesResponse } from "./import-companies";
export const importCompaniesFixture = {
  ok: (overrides: Partial<ImportCompaniesResponse> = {}) =>
    ({
      ...{ created: 0, updated: 0 },
      ...overrides,
    }) satisfies ImportCompaniesResponse,
  problem: (status: 400 | 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
