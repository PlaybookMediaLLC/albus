import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPostFromConversationFixture } from "../../../api/team/create-post-from-conversation.fixture";
import { listBoardsFixture } from "../../../api/team/list-boards.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { fill, press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { NewRequestDialog } from "./new-request-dialog";

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
const board = {
  id: "board_test_1",
  name: "Ideas",
  slug: "ideas",
  description: null,
  access: {
    view: "anonymous" as const,
    vote: "anonymous" as const,
    comment: "anonymous" as const,
    submit: "anonymous" as const,
    segments: { view: [], vote: [], comment: [], submit: [] },
    moderation: {
      anonPosts: "inherit" as const,
      signedPosts: "inherit" as const,
      comments: "inherit" as const,
    },
  },
  visibleSegmentIds: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("NewRequestDialog", () => {
  it("tracks the conversation as a request on a board, titled from the subject", async () => {
    const api = mockApi();
    api.reply(listBoardsFixture.ok({ items: [board] }));
    api.reply(createPostFromConversationFixture.ok());
    const onCreated = vi.fn();
    const view = renderComponent(
      <TeamRuntimeProvider value={team}>
        <NewRequestDialog
          workspaceId="workspace_test_1"
          conversationId="conversation_test_1"
          customerName="Grace"
          subject="Export fails"
          onClose={vi.fn()}
          onCreated={onCreated}
        />
      </TeamRuntimeProvider>,
    );
    expect(
      view.getByText(
        "Creates a request by Grace with their vote, and shares it in the conversation so Grace sees it.",
      ),
    ).toBeInTheDocument();
    expect(await view.findByLabelText("Request title")).toHaveValue(
      "Export fails",
    );
    fill("Request title", "Faster export");
    press("Create request");
    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith("Faster export"),
    );
    expect(
      await api.calls("createQuillsPostFromConversation")[0]!.json(),
    ).toEqual({ boardId: "board_test_1", title: "Faster export", content: "" });
  });
});
