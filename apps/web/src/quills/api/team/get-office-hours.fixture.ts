import type { GetOfficeHoursResponse } from "./get-office-hours";
export const getOfficeHoursFixture = {
  ok: (overrides: Partial<GetOfficeHoursResponse> = {}) =>
    ({
      ...{ enabled: false, timezone: "value", intervals: [], holidays: [] },
      ...overrides,
    }) satisfies GetOfficeHoursResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
