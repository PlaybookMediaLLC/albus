import type { RestoreCommentResponse } from "./restore-comment";
export const restoreCommentFixture = {
  ok: (overrides: Partial<RestoreCommentResponse> = {}) =>
    ({
      ...{
        id: "id_test_1",
        postId: "post_id_test_1",
        parentId: null,
        principalId: "principal_id_test_1",
        authorName: null,
        authorAvatarUrl: null,
        content: "value",
        isTeamMember: false,
        isPrivate: false,
        moderationState: "value",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: null,
        deletedAt: null,
        isRemovedByTeam: false,
        reactions: [],
      },
      ...overrides,
    }) satisfies RestoreCommentResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
