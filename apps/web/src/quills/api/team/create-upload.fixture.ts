import type { CreateUploadResponse } from "./create-upload";
export const createUploadFixture = {
  ok: (overrides: Partial<CreateUploadResponse> = {}) =>
    ({
      ...{
        key: "value",
        uploadUrl: "value",
        headers: { "Content-Type": "value" },
        expiresAt: "value",
      },
      ...overrides,
    }) satisfies CreateUploadResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
