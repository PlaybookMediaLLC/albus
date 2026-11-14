import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveShortcutToken } from "./save-shortcut-token";
import { saveShortcutTokenFixture } from "./save-shortcut-token.fixture";
describe("saveShortcutToken", () => {
  describeOperationContract({
    operationId: "saveQuillsShortcutToken",
    operation: saveShortcutToken,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { apiToken: "mail_link_value" },
    },
    response: saveShortcutTokenFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/shortcut/connection",
    statuses: [401, 403, 409, 429],
  });
});
