import type { GetSpamFilterConfigResponse } from "./get-spam-filter-config";
export const getSpamFilterConfigFixture = {
  ok: (overrides: Partial<GetSpamFilterConfigResponse> = {}) =>
    ({
      ...{ trustedSenders: [], aiClassifier: false },
      ...overrides,
    }) satisfies GetSpamFilterConfigResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
