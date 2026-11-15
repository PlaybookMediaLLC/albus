import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteTeam } from "./delete-team";
import { deleteTeamFixture } from "./delete-team.fixture";
describe("deleteTeam", () => {
  describeOperationContract({
    operationId: "deleteQuillsTeam",
    operation: deleteTeam,
    request: {
      param: { workspaceId: "workspace_test_1", teamId: "team-id_test_1" },
    },
    response: deleteTeamFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/teams/team-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
