import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vite-plus/test";
import { getLinkedPostsForConversationFixture } from "../../../api/team/get-linked-posts-for-conversation.fixture";
import { unlinkPostFromConversationFixture } from "../../../api/team/unlink-post-from-conversation.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { LinkedRequests } from "./linked-requests";

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
const render = (create = true, update = true) =>
  renderComponent(
    inRouter(
      <TeamRuntimeProvider value={team(create, update)}>
        <LinkedRequests
          workspaceId="workspace_test_1"
          conversationId="conversation_test_1"
          customerName="Grace"
          subject="Export fails"
        />
      </TeamRuntimeProvider>,
    ),
  );
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

describe("LinkedRequests", () => {
  it("links each request in the teammate app", async () => {
    const api = mockApi();
    api.reply(getLinkedPostsForConversationFixture.ok(tracked));
    const view = render();
    expect(
      await view.findByRole("link", { name: "Faster export" }),
    ).toHaveAttribute("href", "/feedback/workspace_test_1/posts/post_test_1");
  });

  it("unlinks a request", async () => {
    const api = mockApi();
    api.reply(getLinkedPostsForConversationFixture.ok(tracked));
    api.reply(unlinkPostFromConversationFixture.ok({ changed: true }));
    api.reply(getLinkedPostsForConversationFixture.ok());
    const view = render();
    fireEvent.click(
      await view.findByRole("button", { name: "Unlink “Faster export”" }),
    );
    expect(
      await view.findByText(
        "Unlinked “Faster export”. The request and the vote stay.",
      ),
    ).toBeInTheDocument();
    expect(
      new URL(api.calls("unlinkQuillsPostFromConversation")[0]!.url).pathname,
    ).toBe(
      "/api/quills/workspace_test_1/conversations/conversation_test_1/posts/post_test_1",
    );
    await waitFor(() =>
      expect(view.queryByRole("link", { name: "Faster export" })).toBeNull(),
    );
  });

  it("opens the request search and the new request dialog", async () => {
    const api = mockApi();
    api.reply(getLinkedPostsForConversationFixture.ok());
    api.defer(() => {});
    const view = render();
    press("Link existing");
    expect(
      await view.findByRole("dialog", { name: "Link existing" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() =>
      expect(view.queryByRole("dialog", { name: "Link existing" })).toBeNull(),
    );
    press("New request");
    expect(
      await view.findByRole("dialog", { name: "New request" }),
    ).toBeInTheDocument();
  });

  it("offers no new request, link or unlink without the permissions", async () => {
    const api = mockApi();
    api.reply(getLinkedPostsForConversationFixture.ok(tracked));
    const view = render(false, false);
    expect(
      await view.findByRole("link", { name: "Faster export" }),
    ).toBeInTheDocument();
    for (const name of [
      "New request",
      "Link existing",
      "Unlink “Faster export”",
    ])
      expect(view.queryByRole("button", { name })).toBeNull();
  });

  it("says None without requests or the create permission", async () => {
    const api = mockApi();
    api.reply(getLinkedPostsForConversationFixture.ok());
    const view = render(false);
    expect(await view.findByText("None")).toBeInTheDocument();
  });
});
