import type { SetScoringFactorsResponse } from "./set-scoring-factors";
export const setScoringFactorsFixture = {
  ok: (overrides: Partial<SetScoringFactorsResponse> = {}) =>
    ({ ...{ factors: [] }, ...overrides }) satisfies SetScoringFactorsResponse,
  problem: (status: 400 | 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
