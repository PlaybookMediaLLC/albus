import type { SetAgentAvailabilityResponse } from "./set-agent-availability";
export const setAgentAvailabilityFixture = {
  ok: (overrides: Partial<SetAgentAvailabilityResponse> = {}) =>
    ({
      ...{
        principalId: "principal_id_test_1",
        availability: "online",
        changed: false,
      },
      ...overrides,
    }) satisfies SetAgentAvailabilityResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
