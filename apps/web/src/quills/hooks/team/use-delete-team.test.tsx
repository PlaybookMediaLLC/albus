import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteTeamFixture } from "../../api/team/delete-team.fixture";
import { useDeleteTeam } from "./use-delete-team";
describe("useDeleteTeam", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteTeam,
    operationId: "deleteQuillsTeam",
    request: {
      param: { workspaceId: "workspace_test_1", teamId: "team-id_test_1" },
    },
    response: deleteTeamFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listTeams",
      ),
    ],
  });
});
