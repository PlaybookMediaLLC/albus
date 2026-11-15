import type { UpdateSpamFilterConfigResponse } from "./update-spam-filter-config";
export const updateSpamFilterConfigFixture = {
  ok: (overrides: Partial<UpdateSpamFilterConfigResponse> = {}) =>
    ({
      ...{ trustedSenders: [], aiClassifier: false },
      ...overrides,
    }) satisfies UpdateSpamFilterConfigResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
