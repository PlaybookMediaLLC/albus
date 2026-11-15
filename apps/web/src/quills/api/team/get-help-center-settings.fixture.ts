import type { GetHelpCenterSettingsResponse } from "./get-help-center-settings";
export const getHelpCenterSettingsFixture = {
  ok: (overrides: Partial<GetHelpCenterSettingsResponse> = {}) =>
    ({
      ...{
        homepageTitle: "value",
        homepageDescription: "value",
        headerLinks: [],
        locales: { default: "value", additional: [], chrome: [] },
        autoTranslate: { enabled: false, protectedTerms: [] },
        seo: {
          metaDescription: "value",
          sitemapEnabled: false,
          structuredDataEnabled: false,
          indexable: false,
        },
      },
      ...overrides,
    }) satisfies GetHelpCenterSettingsResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
