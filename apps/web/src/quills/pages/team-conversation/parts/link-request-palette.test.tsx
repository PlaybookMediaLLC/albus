import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPostFromConversationFixture } from "../../../api/team/create-post-from-conversation.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { inboxPosts } from "../../team-posts/inbox.fixture";
import { LinkRequestPalette } from "./link-request-palette";

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
const render = (linkedIds: string[], onClose = vi.fn()) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <LinkRequestPalette
        workspaceId="workspace_test_1"
        conversationId="conversation_test_1"
        customerName="Grace"
        linkedIds={linkedIds}
        onClose={onClose}
      />
    </TeamRuntimeProvider>,
  );
const search = (view: ReturnType<typeof render>, text: string) =>
  fireEvent.change(
    view.getByRole("combobox", {
      name: "Find a request to add Grace's vote to…",
    }),
    { target: { value: text } },
  );

describe("LinkRequestPalette", () => {
  it("adds the customer's vote to the chosen request", async () => {
    const api = mockApi();
    const success = vi.spyOn(toast, "success");
    api.reply(inboxPosts);
    api.reply(createPostFromConversationFixture.ok());
    const onClose = vi.fn();
    const view = render([], onClose);
    search(view, "sign");
    fireEvent.click(
      await view.findByRole("option", { name: /Single sign-on/ }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(success).toHaveBeenCalledWith(
      "Linked “Single sign-on”, added Grace's vote and shared it in the conversation.",
    );
    expect(
      await api.calls("createQuillsPostFromConversation")[0]!.json(),
    ).toEqual({ asUpvoteOfPostId: "post_sso" });
  });

  it("leaves out the requests that are already linked", async () => {
    const api = mockApi();
    api.reply(inboxPosts);
    const view = render(["post_sso"]);
    search(view, "e");
    expect(
      await view.findByRole("option", { name: /Export to CSV/ }),
    ).toBeInTheDocument();
    expect(view.queryByRole("option", { name: /Single sign-on/ })).toBeNull();
  });
});
