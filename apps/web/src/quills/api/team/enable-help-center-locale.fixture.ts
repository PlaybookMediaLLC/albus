import type { EnableHelpCenterLocaleResponse } from "./enable-help-center-locale";
export const enableHelpCenterLocaleFixture = {
  ok: (overrides: Partial<EnableHelpCenterLocaleResponse> = {}) =>
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
    }) satisfies EnableHelpCenterLocaleResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
