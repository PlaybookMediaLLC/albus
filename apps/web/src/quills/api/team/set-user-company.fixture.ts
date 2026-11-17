import type { SetUserCompanyResponse } from "./set-user-company";
export const setUserCompanyFixture = {
  ok: (overrides: Partial<SetUserCompanyResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        domain: null,
        externalId: null,
        plan: null,
        mrrCents: null,
        size: null,
        website: null,
        industry: null,
        source: "value",
        attributes: [],
        memberCount: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies SetUserCompanyResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
