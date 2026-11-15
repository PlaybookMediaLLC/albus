import type { UpdateNotificationPreferencesResponse } from "./update-notification-preferences";
export const updateNotificationPreferencesFixture = {
  ok: (overrides: Partial<UpdateNotificationPreferencesResponse> = {}) =>
    ({
      ...{
        emailStatusChange: true,
        emailNewComment: true,
        emailMuted: false,
        matrix: [],
      },
      ...overrides,
    }) satisfies UpdateNotificationPreferencesResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
