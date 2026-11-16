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
    // A system line is an event, not a bubble.
    expect(
      view.getByText("Conversation resolved").closest(".rounded-2xl"),
    ).toBeNull();
    // Same-day messages share one date separator.
    expect(view.getAllByText(/Jan 1/)).toHaveLength(1);
  });

  it("adds a date separator when the day changes", () => {
    const message = (id: string, createdAt: string) => ({
      id,
      fromVisitor: true,
      senderType: "visitor",
      author: null,
      content: id,
      attachments: [],
      createdAt,
    });
    const view = renderComponent(
      <ConversationMessages
        messages={[
          message("message_test_1", "2026-01-01T10:00:00.000Z"),
          message("message_test_2", "2026-01-01T11:00:00.000Z"),
          message("message_test_3", "2026-01-03T10:00:00.000Z"),
        ]}
      />,
    );
    expect(view.getAllByText(/Jan [13]\b/)).toHaveLength(2);
  });

  it("renders a file with an ID through renderAttachment", () => {
    const view = renderComponent(
      <ConversationMessages
        messages={[
          {
            id: "message_test_1",
            fromVisitor: false,
            senderType: "agent",
            author: { name: "Sam" },
            content: "Here it is",
            attachments: [
              { fileId: "file_test_1", name: "invoice.pdf" },
              { fileId: null, name: "old.pdf" },
            ],
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
        renderAttachment={(file) => <a href={`#${file.fileId}`}>{file.name}</a>}
      />,
    );
    expect(view.getByRole("link", { name: "invoice.pdf" })).toHaveAttribute(
      "href",
      "#file_test_1",
    );
    expect(view.queryByRole("link", { name: /old/ })).toBeNull();
    expect(view.getByText(/old\.pdf/)).toBeInTheDocument();
  });
});
