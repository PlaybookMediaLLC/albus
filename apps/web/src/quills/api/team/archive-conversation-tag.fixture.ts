import type { ArchiveConversationTagResponse } from "./archive-conversation-tag";
export const archiveConversationTagFixture = {
  ok: (overrides: Partial<ArchiveConversationTagResponse> = {}) =>
    ({
      ...{ id: "id_test_1", name: "value", color: "value" },
      ...overrides,
    }) satisfies ArchiveConversationTagResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
