import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listRecentEmailLogFixture } from "../../api/team/list-recent-email-log.fixture";
import { useListRecentEmailLog } from "./use-list-recent-email-log";
describe("useListRecentEmailLog", () => {
  describeHookContract({
    kind: "query",
    hook: useListRecentEmailLog,
    operationId: "listQuillsRecentEmailLog",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listRecentEmailLogFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
