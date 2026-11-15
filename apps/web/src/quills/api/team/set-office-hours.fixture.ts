import type { SetOfficeHoursResponse } from "./set-office-hours";
export const setOfficeHoursFixture = {
  ok: (overrides: Partial<SetOfficeHoursResponse> = {}) =>
    ({
      ...{ enabled: false, timezone: "value", intervals: [], holidays: [] },
      ...overrides,
    }) satisfies SetOfficeHoursResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
