import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getConversationFixture } from "../../../api/team/get-conversation.fixture";
import { listConversationsFixture } from "../../../api/team/list-conversations.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { PreviousConversations } from "./previous-conversations";

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
const row = (id: string, subject: string, status = "closed" as const) => {
  const {
    attributes: _a,
    translation: _t,
    summary: _s,
    summaryUpdatedAt: _u,
    csatComment: _c,
    ...item
  } = getConversationFixture.ok({ id, subject, status });
  return item;
};
const render = () =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory(),
      })}
    >
      <TeamRuntimeProvider value={team}>
        <PreviousConversations
          workspaceId="workspace_test_1"
          conversationId="conversation_test_1"
          visitorPrincipalId="principal_test_9"
        />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );

describe("PreviousConversations", () => {
  it("lists the customer's other conversations and loads more", async () => {
    const api = mockApi();
    api.reply(
      listConversationsFixture.ok({
        items: [
          row("conversation_test_1", "This one", "open" as never),
          row("conversation_test_2", "Wrong VAT number"),
        ],
        nextCursor: "conversation_test_2",
        hasMore: true,
      }),
    );
    api.reply(
      listConversationsFixture.ok({
        items: [row("conversation_test_3", "More seats")],
      }),
    );
    const view = render();
    expect(
      await view.findByRole("link", { name: /Wrong VAT number/ }),
    ).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/conversations/conversation_test_2",
    );
    expect(view.queryByText("This one")).not.toBeInTheDocument();
    const query = new URL(api.calls("listQuillsConversations")[0]!.url)
      .searchParams;
    expect(query.get("visitorPrincipalId")).toBe("principal_test_9");
    fireEvent.click(view.getByRole("button", { name: "Show more" }));
    expect(
      await view.findByRole("link", { name: /More seats/ }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("heading", { level: 2, name: "Previous conversations 2" }),
    ).toBeInTheDocument();
  });

  it("is left out when the customer has no other conversation", async () => {
    const api = mockApi();
    api.reply(
      listConversationsFixture.ok({
        items: [row("conversation_test_1", "This one")],
      }),
    );
    const view = render();
    await vi.waitFor(() => expect(api.calls()).toHaveLength(1));
    expect(view.container).toBeEmptyDOMElement();
  });
});
