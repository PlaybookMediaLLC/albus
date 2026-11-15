import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { enableHelpCenterLocale } from "./enable-help-center-locale";
import { enableHelpCenterLocaleFixture } from "./enable-help-center-locale.fixture";
describe("enableHelpCenterLocale", () => {
  describeOperationContract({
    operationId: "enableQuillsHelpCenterLocale",
    operation: enableHelpCenterLocale,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: {
        locale: "en",
        chrome: {
          homepageTitle: "value",
          homepageDescription: "value",
          searchPlaceholder: "value",
        },
      },
    },
    response: enableHelpCenterLocaleFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/help-center/settings/locales",
    statuses: [401, 403, 409, 429],
  });
});
