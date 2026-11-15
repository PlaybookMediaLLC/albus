import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateTeamBinding } from "./update-team-binding";
import { updateTeamBindingFixture } from "./update-team-binding.fixture";
describe("updateTeamBinding", () => {
  describeOperationContract({
    operationId: "updateQuillsTeamBinding",
    operation: updateTeamBinding,
    request: {
      param: { workspaceId: "workspace_test_1", teamId: "team-id_test_1" },
      json: { kaneoTeamId: null },
    },
    response: updateTeamBindingFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/teams/team-id_test_1/binding",
    statuses: [401, 403, 404, 429],
  });
});
