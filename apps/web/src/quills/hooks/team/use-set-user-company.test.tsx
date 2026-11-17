import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setUserCompanyFixture } from "../../api/team/set-user-company.fixture";
import { useSetUserCompany } from "./use-set-user-company";
describe("useSetUserCompany", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetUserCompany,
    operationId: "setQuillsUserCompany",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
      json: {},
    },
    response: setUserCompanyFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getUser",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getUserCompany",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listUsers",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPosts",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPostDemand",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getRevenueAtRisk",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getProfileTeamContext",
      ),
    ],
  });
});
