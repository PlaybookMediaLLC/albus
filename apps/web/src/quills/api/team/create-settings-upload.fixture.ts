import type { CreateSettingsUploadResponse } from "./create-settings-upload";
export const createSettingsUploadFixture = {
  ok: (overrides: Partial<CreateSettingsUploadResponse> = {}) =>
    ({
      ...{
        key: "value",
        uploadUrl: "value",
        headers: { "Content-Type": "value" },
        expiresAt: "value",
      },
      ...overrides,
    }) satisfies CreateSettingsUploadResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
