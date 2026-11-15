import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { disableHelpCenterLocale } from "./disable-help-center-locale";
import { disableHelpCenterLocaleFixture } from "./disable-help-center-locale.fixture";
describe("disableHelpCenterLocale", () => {
  describeOperationContract({
    operationId: "disableQuillsHelpCenterLocale",
    operation: disableHelpCenterLocale,
    request: {
      param: { workspaceId: "workspace_test_1" },
      query: { locale: "en" },
    },
    response: disableHelpCenterLocaleFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/help-center/settings/locales",
    statuses: [401, 403, 404, 409, 429],
  });
});
