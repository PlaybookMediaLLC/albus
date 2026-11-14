import type { SaveMakeWebhookResponse } from "./save-make-webhook";
export const saveMakeWebhookFixture = {
  ok: (overrides: Partial<SaveMakeWebhookResponse> = {}) =>
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
    }) satisfies SaveMakeWebhookResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
