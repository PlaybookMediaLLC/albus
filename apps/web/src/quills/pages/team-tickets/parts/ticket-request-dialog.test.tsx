import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPostFromTicketFixture } from "../../../api/team/create-post-from-ticket.fixture";
import { fill, press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { postTeam } from "../../team-post/post.fixture";
import { inboxBoards } from "../../team-posts/inbox.fixture";
import { TicketRequestDialog } from "./ticket-request-dialog";

const render = (onClose = vi.fn()) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <TicketRequestDialog ticketId="ticket_test_1" onClose={onClose} />
    </TeamRuntimeProvider>,
  );

describe("TicketRequestDialog", () => {
  it("records the requester's request on the first board and closes", async () => {
    const api = mockApi();
    api.reply(inboxBoards);
    api.reply(createPostFromTicketFixture.ok({ created: true }));
    const onClose = vi.fn();
    const view = render(onClose);
    expect(
      await view.findByRole("dialog", {
        name: "Record a request for the requester",
      }),
    ).toBeVisible();
    await view.findByLabelText("Request title");
    fill("Request title", "Bulk export");
    press("Record request");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [call] = api.calls("createQuillsPostFromTicket");
    expect(new URL(call!.url).pathname).toBe(
      "/api/quills/workspace_test_1/tickets/ticket_test_1/posts",
    );
    await expect(call!.clone().json()).resolves.toEqual({
      boardId: "board_ideas",
      title: "Bulk export",
    });
  });

  it("keeps the dialog open and explains a requester who is not a customer", async () => {
    const api = mockApi();
    api.reply(inboxBoards);
    const problem = createPostFromTicketFixture.problem(409);
    api.reply(problem.body, problem.status);
    const onClose = vi.fn();
    const view = render(onClose);
    await view.findByLabelText("Request title");
    fill("Request title", "Bulk export");
    press("Record request");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "The requester of this ticket is not a customer, so the request cannot be recorded for them.",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
