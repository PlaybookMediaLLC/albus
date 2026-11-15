import type { DisableHelpCenterLocaleResponse } from "./disable-help-center-locale";
export const disableHelpCenterLocaleFixture = {
  ok: (overrides: Partial<DisableHelpCenterLocaleResponse> = {}) =>
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
    }) satisfies DisableHelpCenterLocaleResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
