import type { ListCustomDomainsResponse } from "./list-custom-domains";
export const listCustomDomainsFixture = {
  ok: (overrides: Partial<ListCustomDomainsResponse> = {}) =>
    ({
      ...{ entitled: false, domains: [] },
      ...overrides,
    }) satisfies ListCustomDomainsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
