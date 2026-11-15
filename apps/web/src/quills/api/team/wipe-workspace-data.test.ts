import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { wipeWorkspaceData } from "./wipe-workspace-data";
import { wipeWorkspaceDataFixture } from "./wipe-workspace-data.fixture";
describe("wipeWorkspaceData", () => {
  describeOperationContract({
    operationId: "wipeQuillsWorkspaceData",
    operation: wipeWorkspaceData,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { confirm: "value" },
    },
    response: wipeWorkspaceDataFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/operations/wipe",
    statuses: [401, 403, 429],
  });
});
