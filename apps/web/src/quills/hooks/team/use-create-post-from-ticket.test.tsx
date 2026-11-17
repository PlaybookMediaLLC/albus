import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createPostFromTicketFixture } from "../../api/team/create-post-from-ticket.fixture";
import { useCreatePostFromTicket } from "./use-create-post-from-ticket";
describe("useCreatePostFromTicket", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreatePostFromTicket,
    operationId: "createQuillsPostFromTicket",
    request: {
      param: { workspaceId: "workspace_test_1", ticketId: "ticket-id_test_1" },
      json: {},
    },
    response: createPostFromTicketFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
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
        "getTeamCounts",
      ),
    ],
  });
});
