import type { GetPoweredByResponse } from "./get-powered-by";
export const getPoweredByFixture = {
  ok: (overrides: Partial<GetPoweredByResponse> = {}) =>
    ({
      ...{ showPoweredBy: false },
      ...overrides,
    }) satisfies GetPoweredByResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
