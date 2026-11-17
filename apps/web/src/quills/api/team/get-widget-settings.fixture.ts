import type { GetWidgetSettingsResponse } from "./get-widget-settings";
export const getWidgetSettingsFixture = {
  ok: (overrides: Partial<GetWidgetSettingsResponse> = {}) =>
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
      },
      ...overrides,
    }) satisfies GetWidgetSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
