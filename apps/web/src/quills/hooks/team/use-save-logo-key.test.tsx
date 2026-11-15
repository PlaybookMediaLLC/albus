import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { saveLogoKeyFixture } from "../../api/team/save-logo-key.fixture";
import { useSaveLogoKey } from "./use-save-logo-key";
describe("useSaveLogoKey", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSaveLogoKey,
    operationId: "saveQuillsLogoKey",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0 },
    },
    response: saveLogoKeyFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
