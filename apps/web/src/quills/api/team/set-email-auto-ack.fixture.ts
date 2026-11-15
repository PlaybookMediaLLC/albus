import type { SetEmailAutoAckResponse } from "./set-email-auto-ack";
export const setEmailAutoAckFixture = {
  ok: (overrides: Partial<SetEmailAutoAckResponse> = {}) =>
    ({ ...{ enabled: false }, ...overrides }) satisfies SetEmailAutoAckResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
