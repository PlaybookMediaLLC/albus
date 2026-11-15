import type { SaveStripeKeyResponse } from "./save-stripe-key";
export const saveStripeKeyFixture = {
  ok: (overrides: Partial<SaveStripeKeyResponse> = {}) =>
    ({
      ...{
        integration: {
          id: "integration_test_1",
          integrationType: "provider",
          status: "active",
          workspaceName: null,
          account: null,
          connectedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      ...overrides,
    }) satisfies SaveStripeKeyResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
