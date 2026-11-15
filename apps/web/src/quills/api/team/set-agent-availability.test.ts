import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setAgentAvailability } from "./set-agent-availability";
import { setAgentAvailabilityFixture } from "./set-agent-availability.fixture";
describe("setAgentAvailability", () => {
  describeOperationContract({
    operationId: "setQuillsAgentAvailability",
    operation: setAgentAvailability,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { availability: "online" },
    },
    response: setAgentAvailabilityFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/availability",
    statuses: [401, 403, 429],
  });
});
