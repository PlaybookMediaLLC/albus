import type { GetScoringFactorsResponse } from "./get-scoring-factors";
export const getScoringFactorsFixture = {
  ok: (overrides: Partial<GetScoringFactorsResponse> = {}) =>
    ({ ...{ factors: [] }, ...overrides }) satisfies GetScoringFactorsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
