import type { SetPoweredByResponse } from "./set-powered-by";
export const setPoweredByFixture = {
  ok: (overrides: Partial<SetPoweredByResponse> = {}) =>
    ({
      ...{ showPoweredBy: false },
      ...overrides,
    }) satisfies SetPoweredByResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
