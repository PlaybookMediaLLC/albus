import type { SetModerationDefaultResponse } from "./set-moderation-default";
export const setModerationDefaultFixture = {
  ok: (overrides: Partial<SetModerationDefaultResponse> = {}) =>
    ({
      ...{
        moderationDefault: {
          requireApproval: "none",
          holdImages: false,
          holdLinks: false,
          holdSpam: false,
          holdSensitive: false,
        },
      },
      ...overrides,
    }) satisfies SetModerationDefaultResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
