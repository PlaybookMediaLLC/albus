import type { ListSettingsResponse } from "./list-settings";
export const listSettingsFixture = {
  ok: (overrides: Partial<ListSettingsResponse> = {}) =>
    ({
      ...{
        name: "value",
        slug: "value",
        modules: {
          feedback: false,
          changelog: false,
          helpCenter: false,
          supportInbox: false,
          supportTickets: false,
          statusPage: false,
        },
        areas: [],
      },
      ...overrides,
    }) satisfies ListSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
