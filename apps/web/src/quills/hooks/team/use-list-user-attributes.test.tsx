import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listUserAttributesFixture } from "../../api/team/list-user-attributes.fixture";
import { useListUserAttributes } from "./use-list-user-attributes";
describe("useListUserAttributes", () => {
  describeHookContract({
    kind: "query",
    hook: useListUserAttributes,
    operationId: "listQuillsUserAttributes",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listUserAttributesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
