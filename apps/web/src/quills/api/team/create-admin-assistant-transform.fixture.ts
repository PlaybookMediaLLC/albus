import type { CreateAdminAssistantTransformResponse } from "./create-admin-assistant-transform";
export const createAdminAssistantTransformFixture = {
  ok: (overrides: Partial<CreateAdminAssistantTransformResponse> = {}) =>
    ({
      ...{ text: "value" },
      ...overrides,
    }) satisfies CreateAdminAssistantTransformResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
