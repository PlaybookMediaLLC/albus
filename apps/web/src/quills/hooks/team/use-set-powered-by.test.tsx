import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setPoweredByFixture } from "../../api/team/set-powered-by.fixture";
import { useSetPoweredBy } from "./use-set-powered-by";
describe("useSetPoweredBy", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetPoweredBy,
    operationId: "setQuillsPoweredBy",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { showPoweredBy: false },
    },
    response: setPoweredByFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPoweredBy",
      ),
    ],
  });
});
