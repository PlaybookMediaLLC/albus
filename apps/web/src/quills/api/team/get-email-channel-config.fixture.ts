import type { GetEmailChannelConfigResponse } from "./get-email-channel-config";
export const getEmailChannelConfigFixture = {
  ok: (overrides: Partial<GetEmailChannelConfigResponse> = {}) =>
    ({
      ...{ inboundRoute: null, sendingAddresses: [], domains: [] },
      ...overrides,
    }) satisfies GetEmailChannelConfigResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
