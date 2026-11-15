import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateTeamBindingFixture } from "../../api/team/update-team-binding.fixture";
import { useUpdateTeamBinding } from "./use-update-team-binding";
describe("useUpdateTeamBinding", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateTeamBinding,
    operationId: "updateQuillsTeamBinding",
    request: {
      param: { workspaceId: "workspace_test_1", teamId: "team-id_test_1" },
      json: { kaneoTeamId: null },
    },
    response: updateTeamBindingFixture.ok(),
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
