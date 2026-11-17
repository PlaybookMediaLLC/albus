import { describe, expect, it, vi } from "vite-plus/test";
import { createPortalPostFixture } from "../../../api/feedback/create-portal-post.fixture";
import { confirmFeedbackCardFixture } from "../../../api/support/confirm-feedback-card.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { FeedbackCardAction } from "./feedback-card-action";

const props = {
  workspaceId: "workspace_test_1",
  conversationId: "conversation_test_1",
  messageId: "conversation_msg_test_1",
  viewer: { kind: "user" as const, id: "account_test_1" },
};

describe("FeedbackCardAction", () => {
  it("posts the proposed request, then confirms the card with that post", async () => {
    const api = mockApi();
    api.reply(createPortalPostFixture.ok({ id: "post_test_1" }));
    api.reply(confirmFeedbackCardFixture.ok());
    const view = renderComponent(
      <FeedbackCardAction
        {...props}
        card={{ title: "PDF export", body: "", status: "proposed" }}
      />,
    );
    press("Submit request");
    await vi.waitFor(() =>
      expect(api.calls("confirmQuillsFeedbackCard")).toHaveLength(1),
    );
    expect(await api.calls("createQuillsPortalPost")[0]!.json()).toEqual({
      title: "PDF export",
      content: "PDF export",
      idempotencyKey: "card:conversation_msg_test_1",
    });
    expect(view.queryByRole("alert")).toBeNull();
  });

  it("says when the request fails and shows a submitted card without a button", async () => {
    mockApi().reply({ message: "No" }, 403);
    const view = renderComponent(
      <FeedbackCardAction
        {...props}
        card={{ title: "PDF export", body: "As PDF", status: "proposed" }}
      />,
    );
    press("Submit request");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "The request could not be submitted.",
    );
    view.rerender(
      <FeedbackCardAction
        {...props}
        card={{ title: "PDF export", body: "As PDF", status: "confirmed" }}
      />,
    );
    expect(view.getByRole("status")).toHaveTextContent("Request submitted");
    expect(view.queryByRole("button")).toBeNull();
  });
});
