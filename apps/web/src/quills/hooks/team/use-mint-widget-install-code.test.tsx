import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { mintWidgetInstallCodeFixture } from "../../api/team/mint-widget-install-code.fixture";
import { useMintWidgetInstallCode } from "./use-mint-widget-install-code";
describe("useMintWidgetInstallCode", () => {
  describeHookContract({
    kind: "mutation",
    hook: useMintWidgetInstallCode,
    operationId: "mintQuillsWidgetInstallCode",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: mintWidgetInstallCodeFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
