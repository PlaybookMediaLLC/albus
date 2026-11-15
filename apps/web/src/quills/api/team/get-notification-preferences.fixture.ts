import type { GetNotificationPreferencesResponse } from "./get-notification-preferences";
export const getNotificationPreferencesFixture = {
  ok: (overrides: Partial<GetNotificationPreferencesResponse> = {}) =>
    ({
      ...{
        emailStatusChange: true,
        emailNewComment: true,
        emailMuted: false,
        matrix: [],
      },
      ...overrides,
    }) satisfies GetNotificationPreferencesResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
