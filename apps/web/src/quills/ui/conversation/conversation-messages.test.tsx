import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { ConversationMessages } from "./conversation-messages";
describe("ConversationMessages", () => {
  it("shows the empty state", () => {
    const view = renderComponent(<ConversationMessages messages={[]} />);
    expect(
      view.getByRole("heading", { name: /messages/i }),
    ).toBeInTheDocument();
    expect(view.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("renders safe message content and attachment names", () => {
    const view = renderComponent(
      <ConversationMessages
        messages={[
          {
            id: "message_test_1",
            fromVisitor: false,
            senderType: "agent",
            author: { name: "Sam" },
            content: "**We can help**",
            attachments: [{ name: "answer.pdf" }],
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
      />,
    );
    expect(view.getByText("**We can help**")).toBeInTheDocument();
    expect(view.getByText(/answer\.pdf/i)).toBeInTheDocument();
  });

  it("puts the customer's messages on the right and shows system lines as events", () => {
    const base = {
      author: null,
      attachments: [],
      createdAt: "2026-01-01T10:00:00.000Z",
    };
    const view = renderComponent(
      <ConversationMessages
        messages={[
          {
            ...base,
            id: "message_test_1",
            fromVisitor: true,
            senderType: "visitor",
            content: "Export fails",
          },
          {
            ...base,
            id: "message_test_2",
            fromVisitor: false,
            senderType: "system",
            content: "Conversation resolved",
          },
          {
            ...base,
            id: "message_test_3",
            fromVisitor: false,
            senderType: "agent",
            content: "Fixed now",
          },
        ]}
      />,
    );
    expect(
      view.getByText("Export fails").closest(".flex-row-reverse"),
    ).not.toBeNull();
    expect(view.getByText("Fixed now").closest(".flex-row-reverse")).toBeNull();
    expect(
      view.getByText("Conversation resolved").closest(".bg-muted"),
    ).toBeNull();
    expect(
      view.container.querySelectorAll(
        "time[datetime='2026-01-01T10:00:00.000Z']",
      ).length,
    ).toBeGreaterThan(0);
  });
});
