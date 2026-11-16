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
