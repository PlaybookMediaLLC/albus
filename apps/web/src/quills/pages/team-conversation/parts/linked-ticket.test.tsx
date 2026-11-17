import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createTicketFixture } from "../../../api/team/create-ticket.fixture";
import { getConversationTicketLinkFixture } from "../../../api/team/get-conversation-ticket-link.fixture";
import { linkTicketToConversationFixture } from "../../../api/team/link-ticket-to-conversation.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { LinkedTicket } from "./linked-ticket";

const team = (create = true, update = true) => ({
  workspaceId: "workspace_test_1",
  viewer: { kind: "user" as const, id: "user_test_1" },
  permissions: {
    read: true,
    create,
    update,
    delete: true,
    manageSettings: true,
  },
});
const inRouter = (element: ReactElement) => (
  <RouterContextProvider
    router={createRouter({
      routeTree: createRootRoute(),
      history: createMemoryHistory(),
    })}
  >
    {element}
  </RouterContextProvider>
);
const render = (create = true) =>
  renderComponent(
    inRouter(
      <TeamRuntimeProvider value={team(create)}>
        <LinkedTicket
          workspaceId="workspace_test_1"
          conversationId="conversation_test_1"
          visitorPrincipalId="principal_test_9"
          subject="Export fails"
        />
      </TeamRuntimeProvider>,
    ),
  );
const pairedTicket = {
  ticket: {
    id: "ticket_test_1",
    number: 12,
    reference: "#12",
    title: "Refund",
    status: { name: "Waiting", category: "pending" as const },
  },
};

describe("LinkedTicket", () => {
  it("links the paired customer ticket", async () => {
    const api = mockApi();
    api.reply(getConversationTicketLinkFixture.ok(pairedTicket));
    const view = render();
    expect(
      await view.findByRole("link", { name: "#12 Refund · Waiting" }),
    ).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/tickets/ticket_test_1",
    );
    expect(view.queryByRole("button", { name: "Create ticket" })).toBeNull();
  });

  it("creates a customer ticket for the customer and pairs it with the conversation", async () => {
    const api = mockApi();
    const success = vi.spyOn(toast, "success");
    api.reply(getConversationTicketLinkFixture.ok());
    api.reply(createTicketFixture.ok({ id: "ticket_test_7", reference: "#7" }));
    api.reply(linkTicketToConversationFixture.ok({ changed: true }));
    api.reply(getConversationTicketLinkFixture.ok(pairedTicket));
    const view = render();
    press("Create ticket");
    expect(await view.findByLabelText("Ticket title")).toHaveValue(
      "Export fails",
    );
    fireEvent.click(
      view
        .getAllByRole("button", { name: "Create ticket" })
        .find((button) => button.getAttribute("type") === "submit")!,
    );
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("Created ticket #7."),
    );
    expect(await api.calls("createQuillsTicket")[0]!.json()).toEqual({
      type: "customer",
      title: "Export fails",
      requesterPrincipalId: "principal_test_9",
      conversationId: "conversation_test_1",
    });
    expect(
      new URL(api.calls("linkQuillsTicketToConversation")[0]!.url).pathname,
    ).toBe(
      "/api/quills/workspace_test_1/tickets/ticket_test_7/conversations/conversation_test_1",
    );
    expect(
      await view.findByRole("link", { name: "#12 Refund · Waiting" }),
    ).toBeInTheDocument();
  });

  it("names the new ticket when it could not be paired", async () => {
    const api = mockApi();
    const error = vi.spyOn(toast, "error");
    api.reply(getConversationTicketLinkFixture.ok());
    api.reply(createTicketFixture.ok({ id: "ticket_test_7", reference: "#7" }));
    const conflict = linkTicketToConversationFixture.problem(409);
    api.reply(conflict.body, conflict.status);
    const view = render();
    press("Create ticket");
    await view.findByLabelText("Ticket title");
    fireEvent.click(
      view
        .getAllByRole("button", { name: "Create ticket" })
        .find((button) => button.getAttribute("type") === "submit")!,
    );
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "Created ticket #7, but it could not be linked to this conversation. Find it in Tickets.",
      ),
    );
  });

  it("offers no ticket creation without the create permission", async () => {
    const api = mockApi();
    api.reply(getConversationTicketLinkFixture.ok());
    const view = render(false);
    expect(await view.findByText("None")).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Create ticket" })).toBeNull();
  });
});
