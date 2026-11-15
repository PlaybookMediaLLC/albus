import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listCustomDomainsFixture } from "../../api/team/list-custom-domains.fixture";
import { useListCustomDomains } from "./use-list-custom-domains";
describe("useListCustomDomains", () => {
  describeHookContract({
    kind: "query",
    hook: useListCustomDomains,
    operationId: "listQuillsCustomDomains",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listCustomDomainsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
