import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateTeam } from "./update-team";
import { updateTeamFixture } from "./update-team.fixture";
describe("updateTeam", () => {
  describeOperationContract({
    operationId: "updateQuillsTeam",
    operation: updateTeam,
    request: {
      param: { workspaceId: "workspace_test_1", teamId: "team-id_test_1" },
      json: {},
    },
    response: updateTeamFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/teams/team-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
