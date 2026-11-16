import type { GetMyConversationFileResponse } from "./get-my-conversation-file";
export const getMyConversationFileFixture = {
  ok: (overrides: Partial<GetMyConversationFileResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        name: "value",
        contentType: "value",
        size: 0,
        downloadUrl: "value",
        downloadExpiresAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    }) satisfies GetMyConversationFileResponse,
  problem: (status: 401 | 403 | 404) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
