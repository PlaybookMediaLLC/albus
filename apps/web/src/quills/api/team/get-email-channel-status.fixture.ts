import type { GetEmailChannelStatusResponse } from "./get-email-channel-status";
export const getEmailChannelStatusFixture = {
  ok: (overrides: Partial<GetEmailChannelStatusResponse> = {}) =>
    ({
      ...{
        provider: "ses",
        fromAddress: null,
        inboundConfigured: false,
        inboundDomain: null,
      },
      ...overrides,
    }) satisfies GetEmailChannelStatusResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
