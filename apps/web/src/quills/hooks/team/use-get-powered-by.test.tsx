import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getPoweredByFixture } from "../../api/team/get-powered-by.fixture";
import { useGetPoweredBy } from "./use-get-powered-by";
describe("useGetPoweredBy", () => {
  describeHookContract({
    kind: "query",
    hook: useGetPoweredBy,
    operationId: "getQuillsPoweredBy",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getPoweredByFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
