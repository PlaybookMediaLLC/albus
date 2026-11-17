import type { CreateUserResponse } from "./create-user";
export const createUserFixture = {
  ok: (overrides: Partial<CreateUserResponse> = {}) =>
    ({
      ...{
        principalId: "principal_id_test_1",
        userId: "user_id_test_1",
        name: "value",
        email: null,
        contactEmail: null,
        image: null,
        emailVerified: false,
        isLead: false,
        country: null,
        locale: null,
        externalId: null,
        attributes: [],
        companyId: null,
        blockedAt: null,
        joinedAt: "2026-01-01T00:00:00.000Z",
        postCount: 0,
        commentCount: 0,
        voteCount: 0,
      },
      ...overrides,
    }) satisfies CreateUserResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
