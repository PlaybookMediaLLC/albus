import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateTeamFixture } from "../../api/team/update-team.fixture";
import { useUpdateTeam } from "./use-update-team";
describe("useUpdateTeam", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateTeam,
    operationId: "updateQuillsTeam",
    request: {
      param: { workspaceId: "workspace_test_1", teamId: "team-id_test_1" },
      json: {},
    },
    response: updateTeamFixture.ok(),
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
