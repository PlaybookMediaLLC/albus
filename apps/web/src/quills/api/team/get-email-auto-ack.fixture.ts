import type { GetEmailAutoAckResponse } from "./get-email-auto-ack";
export const getEmailAutoAckFixture = {
  ok: (overrides: Partial<GetEmailAutoAckResponse> = {}) =>
    ({ ...{ enabled: false }, ...overrides }) satisfies GetEmailAutoAckResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
