import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createPostFromTicket } from "./create-post-from-ticket";
import { createPostFromTicketFixture } from "./create-post-from-ticket.fixture";
describe("createPostFromTicket", () => {
  describeOperationContract({
    operationId: "createQuillsPostFromTicket",
    operation: createPostFromTicket,
    request: {
      param: { workspaceId: "workspace_test_1", ticketId: "ticket-id_test_1" },
      json: {},
    },
    response: createPostFromTicketFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/tickets/ticket-id_test_1/posts",
    statuses: [401, 403, 404, 409, 429],
  });
});
