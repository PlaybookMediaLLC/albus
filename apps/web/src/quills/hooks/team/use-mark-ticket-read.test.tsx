import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { markTicketReadFixture } from "../../api/team/mark-ticket-read.fixture";
import { useMarkTicketRead } from "./use-mark-ticket-read";
describe("useMarkTicketRead", () => {
  describeHookContract({
    kind: "mutation",
    hook: useMarkTicketRead,
    operationId: "markQuillsTicketRead",
    request: {
      param: { workspaceId: "workspace_test_1", ticketId: "ticket-id_test_1" },
    },
    response: markTicketReadFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
