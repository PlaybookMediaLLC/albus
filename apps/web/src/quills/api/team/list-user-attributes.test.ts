import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listUserAttributes } from "./list-user-attributes";
import { listUserAttributesFixture } from "./list-user-attributes.fixture";
describe("listUserAttributes", () => {
  describeOperationContract({
    operationId: "listQuillsUserAttributes",
    operation: listUserAttributes,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listUserAttributesFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/user-attributes",
    statuses: [401, 403, 429],
  });
});
