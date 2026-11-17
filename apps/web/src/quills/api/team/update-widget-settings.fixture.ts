import type { UpdateWidgetSettingsResponse } from "./update-widget-settings";
export const updateWidgetSettingsFixture = {
  ok: (overrides: Partial<UpdateWidgetSettingsResponse> = {}) =>
    ({
      ...{
        enabled: false,
        defaultBoard: null,
        position: "value",
        launcherGreeting: "value",
        launcherLabel: "value",
        replyTime: null,
        tabs: {
          feedback: false,
          changelog: false,
          help: false,
          messenger: false,
          tickets: false,
          home: false,
        },
        visitorAnalytics: false,
        visitorDeviceTracking: false,
        home: {
          greeting: null,
          subtitle: null,
          headerStyle: "value",
          gradientFrom: null,
          gradientTo: null,
          pattern: "value",
          showLogo: false,
          showTeamAvatars: false,
          cards: [],
        },
        receiptId: null,
      },
      ...overrides,
    }) satisfies UpdateWidgetSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
