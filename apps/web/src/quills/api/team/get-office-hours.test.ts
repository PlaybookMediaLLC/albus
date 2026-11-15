import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getOfficeHours } from "./get-office-hours";
import { getOfficeHoursFixture } from "./get-office-hours.fixture";
describe("getOfficeHours", () => {
  describeOperationContract({
    operationId: "getQuillsOfficeHours",
    operation: getOfficeHours,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getOfficeHoursFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/office-hours",
    statuses: [401, 403, 429],
  });
});
