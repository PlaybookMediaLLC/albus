import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setOfficeHours } from "./set-office-hours";
import { setOfficeHoursFixture } from "./set-office-hours.fixture";
describe("setOfficeHours", () => {
  describeOperationContract({
    operationId: "setQuillsOfficeHours",
    operation: setOfficeHours,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false, timezone: "value", intervals: [] },
    },
    response: setOfficeHoursFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/office-hours",
    statuses: [401, 403, 429],
  });
});
