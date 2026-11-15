import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setOfficeHoursFixture } from "../../api/team/set-office-hours.fixture";
import { useSetOfficeHours } from "./use-set-office-hours";
describe("useSetOfficeHours", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetOfficeHours,
    operationId: "setQuillsOfficeHours",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false, timezone: "value", intervals: [] },
    },
    response: setOfficeHoursFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getOfficeHours",
      ),
    ],
  });
});
