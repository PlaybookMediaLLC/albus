import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { getMyConversationFileFixture } from "../../../api/support/get-my-conversation-file.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { ConversationFileLink } from "./conversation-file-link";

describe("ConversationFileLink", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens a fresh download URL of the reply's file on click", async () => {
    const api = mockApi();
    api.reply(
      getMyConversationFileFixture.ok({
        downloadUrl: "https://storage.example.test/a.pdf",
      }),
    );
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);
    renderComponent(
      <ConversationFileLink
        workspaceId="workspace_test_1"
        conversationId="conversation_test_1"
        fileId="file_test_1"
        name="invoice.pdf"
      />,
    );
    press("Attachment: invoice.pdf");
    await vi.waitFor(() =>
      expect(open).toHaveBeenCalledWith(
        "https://storage.example.test/a.pdf",
        "_blank",
      ),
    );
    expect(
      new URL(api.calls("getQuillsMyConversationFile")[0]!.url).pathname,
    ).toBe(
      "/api/quills-public/workspace_test_1/support/conversations/conversation_test_1/files/file_test_1",
    );
  });
});
