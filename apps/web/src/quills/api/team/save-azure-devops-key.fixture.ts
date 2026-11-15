import type { SaveAzureDevopsKeyResponse } from "./save-azure-devops-key";
export const saveAzureDevopsKeyFixture = {
  ok: (overrides: Partial<SaveAzureDevopsKeyResponse> = {}) =>
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
    }) satisfies SaveAzureDevopsKeyResponse,
  problem: (status: 400 | 401 | 403 | 409 | 429 | 502) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
