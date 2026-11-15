import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { setAgentAvailabilityFixture } from "../../api/team/set-agent-availability.fixture";
import { useSetAgentAvailability } from "./use-set-agent-availability";
describe("useSetAgentAvailability", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetAgentAvailability,
    operationId: "setQuillsAgentAvailability",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { availability: "online" },
    },
    response: setAgentAvailabilityFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
