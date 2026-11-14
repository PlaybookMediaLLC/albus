import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { wipeWorkspaceDataFixture } from "../../api/team/wipe-workspace-data.fixture";
import { useWipeWorkspaceData } from "./use-wipe-workspace-data";
describe("useWipeWorkspaceData", () => {
  describeHookContract({
    kind: "mutation",
    hook: useWipeWorkspaceData,
    operationId: "wipeQuillsWorkspaceData",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { confirm: "value" },
    },
    response: wipeWorkspaceDataFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
