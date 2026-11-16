import { describe, expect, it } from "vite-plus/test";
import { getMyConversationFileFixture } from "../../../api/support/get-my-conversation-file.fixture";
import {
  PortalRuntimeProvider,
  type PortalRuntimeValue,
} from "../../../portal/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { ConversationFileLink } from "./conversation-file-link";

const runtime = {
  viewer: { kind: "user", id: "user_test_1" },
} as unknown as PortalRuntimeValue;

describe("ConversationFileLink", () => {
  it("links the reply's file through the customer's conversation", async () => {
    const api = mockApi();
    api.reply(
      getMyConversationFileFixture.ok({
        downloadUrl: "https://storage.example.test/a.pdf",
      }),
    );
    const view = renderComponent(
      <PortalRuntimeProvider value={runtime}>
        <ConversationFileLink
          workspaceId="workspace_test_1"
          conversationId="conversation_test_1"
          fileId="file_test_1"
          name="invoice.pdf"
        />
      </PortalRuntimeProvider>,
    );
    expect(view.getByText("Attachment: invoice.pdf")).toBeInTheDocument();
    expect(
      await view.findByRole("link", { name: "Attachment: invoice.pdf" }),
    ).toHaveAttribute("href", "https://storage.example.test/a.pdf");
    expect(
      new URL(api.calls("getQuillsMyConversationFile")[0]!.url).pathname,
    ).toBe(
      "/api/quills-public/workspace_test_1/support/conversations/conversation_test_1/files/file_test_1",
    );
  });
});
