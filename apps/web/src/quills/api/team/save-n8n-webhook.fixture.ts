import type { SaveN8nWebhookResponse } from "./save-n8n-webhook";
export const saveN8nWebhookFixture = {
  ok: (overrides: Partial<SaveN8nWebhookResponse> = {}) =>
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
    }) satisfies SaveN8nWebhookResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
