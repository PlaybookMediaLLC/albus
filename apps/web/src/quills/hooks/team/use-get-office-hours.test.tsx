import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getOfficeHoursFixture } from "../../api/team/get-office-hours.fixture";
import { useGetOfficeHours } from "./use-get-office-hours";
describe("useGetOfficeHours", () => {
  describeHookContract({
    kind: "query",
    hook: useGetOfficeHours,
    operationId: "getQuillsOfficeHours",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getOfficeHoursFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
