import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";
import { getConversationTicketLinkFixture } from "../../../api/team/get-conversation-ticket-link.fixture";
import { getLinkedPostsForConversationFixture } from "../../../api/team/get-linked-posts-for-conversation.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { LinksSection } from "./links-section";

const team = {
  workspaceId: "workspace_test_1",
  viewer: { kind: "user" as const, id: "user_test_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};
// The links are router links, so the section renders inside a router.
const render = () =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory(),
      })}
    >
      <TeamRuntimeProvider value={team}>
        <LinksSection
          workspaceId="workspace_test_1"
          conversationId="conversation_test_1"
          visitorPrincipalId="principal_test_9"
          customerName="Grace"
          subject="Export fails"
        />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
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
const tracked = {
  items: [
    {
      postId: "post_test_1",
      title: "Faster export",
      boardId: "board_test_1",
      boardSlug: "ideas",
    },
  ],
};

describe("LinksSection", () => {
  it("links the customer ticket and the requests in the teammate app", async () => {
    const api = mockApi();
    api.reply(getConversationTicketLinkFixture.ok(pairedTicket));
    api.reply(getLinkedPostsForConversationFixture.ok(tracked));
    const view = render();
    expect(
      await view.findByRole("link", { name: "#12 Refund · Waiting" }),
    ).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/tickets/ticket_test_1",
    );
    expect(
      await view.findByRole("link", { name: "Faster export" }),
    ).toHaveAttribute("href", "/feedback/workspace_test_1/posts/post_test_1");
    expect(
      view.queryByRole("button", { name: "Create ticket" }),
    ).not.toBeInTheDocument();
  });
});
