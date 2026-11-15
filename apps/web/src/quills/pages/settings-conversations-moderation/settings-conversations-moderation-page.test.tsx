import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getModerationStatusFixture } from "../../api/team/get-moderation-status.fixture";
import { getSpamFilterConfigFixture } from "../../api/team/get-spam-filter-config.fixture";
import { listFlaggedMessagesFixture } from "../../api/team/list-flagged-messages.fixture";
import { listPendingModerationFixture } from "../../api/team/list-pending-moderation.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsConversationsModerationPage } from "./settings-conversations-moderation-page";

const pending = listPendingModerationFixture.ok({
  posts: [
    {
      id: "post_1",
      title: "Dark mode",
      content: "Please add **dark** mode.",
      createdAt: "2026-01-01T00:00:00.000Z",
      boardId: "board_1",
      boardName: "Ideas",
      authorName: null,
    },
  ],
});
const flagged = listFlaggedMessagesFixture.ok({
  items: [
    {
      messageId: "message_1",
      conversationId: "conversation_1",
      preview: "Buy cheap watches",
      isInternal: false,
      authorPrincipalId: null,
      flaggedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
});

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(getModerationStatusFixture.ok({ enabled: true, pendingCount: 1 }));
  api.reply(pending);
  api.reply(getSpamFilterConfigFixture.ok({ trustedSenders: ["a.test"] }));
  api.reply(flagged);
};

describe("SettingsConversationsModerationPage", () => {
  describePageContract(meta, SettingsConversationsModerationPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 4; index += 1) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 4; index += 1) api.fail();
      },
    },
    ready: {
      prepare: ready,
      assert: async (view) => {
        expect(await view.findByText("1 item waits for review.")).toBeVisible();
        expect(view.getByText("Please add dark mode.")).toBeVisible();
        expect(view.getByText("Ideas · Guest")).toBeVisible();
        expect(
          view.getByRole("link", { name: "Buy cheap watches" }),
        ).toHaveAttribute(
          "href",
          "/feedback/workspace_test_1/conversations/conversation_1",
        );
        expect(view.getByLabelText("Trusted senders")).toHaveValue("a.test");
      },
    },
    done: {
      prepare: () => {
        ready();
        api.reply({ id: "post_1" });
        api.reply(listPendingModerationFixture.ok());
        api.reply(getModerationStatusFixture.ok({ enabled: true }));
      },
      act: async (view) => {
        fireEvent.click(await view.findByRole("button", { name: "Approve" }));
      },
      assert: async () => {
        await waitFor(() =>
          expect(api.calls("approveQuillsPost")).toHaveLength(1),
        );
      },
    },
  });

  it("saves the trusted senders, one entry on each line", async () => {
    ready();
    api.reply({ trustedSenders: ["a.test", "b@c.test"], aiClassifier: false });
    api.reply(getSpamFilterConfigFixture.ok());
    const view = renderPage(SettingsConversationsModerationPage, meta);
    fireEvent.change(await view.findByLabelText("Trusted senders"), {
      target: { value: "a.test\n\nb@c.test" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsSpamFilterConfig")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsSpamFilterConfig")[0]!.json()).toEqual({
      trustedSenders: ["a.test", "b@c.test"],
    });
  });

  it("shows the trusted senders that the API stored after a save", async () => {
    ready();
    api.reply({ trustedSenders: ["a.test"], aiClassifier: false });
    api.reply(getSpamFilterConfigFixture.ok({ trustedSenders: ["a.test"] }));
    const view = renderPage(SettingsConversationsModerationPage, meta);
    fireEvent.change(await view.findByLabelText("Trusted senders"), {
      target: { value: "A.TEST\nnot valid" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(view.getByLabelText("Trusted senders")).toHaveValue("a.test"),
    );
  });

  it("shows the review queue to a member and does not read the spam filter", async () => {
    api = mockApi();
    api.reply(
      getModerationStatusFixture.ok({ enabled: true, pendingCount: 1 }),
    );
    api.reply(pending);
    api.reply(flagged);
    const view = renderPage(SettingsConversationsModerationPage, meta, {
      permissions: { manageSettings: false },
    });
    expect(await view.findByText("Please add dark mode.")).toBeVisible();
    expect(view.getByRole("link", { name: "Buy cheap watches" })).toBeVisible();
    expect(view.queryByLabelText("Trusted senders")).toBeNull();
    expect(view.queryByRole("alert")).toBeNull();
    expect(api.calls("getQuillsSpamFilterConfig")).toHaveLength(0);
  });

  it("shows a spam filter failure in its section and keeps the queue", async () => {
    api = mockApi();
    api.reply(
      getModerationStatusFixture.ok({ enabled: true, pendingCount: 1 }),
    );
    api.reply(pending);
    api.reply({ message: "Forbidden" }, 403);
    api.reply(flagged);
    const view = renderPage(SettingsConversationsModerationPage, meta);
    expect(await view.findByText("Please add dark mode.")).toBeVisible();
    expect(await view.findByRole("alert")).toHaveTextContent(/permission/i);
    expect(view.getByRole("link", { name: "Buy cheap watches" })).toBeVisible();
  });

  it("shows empty lists and says that no board holds posts", async () => {
    api = mockApi();
    api.reply(getModerationStatusFixture.ok());
    api.reply(listPendingModerationFixture.ok());
    api.reply(getSpamFilterConfigFixture.ok());
    api.reply(listFlaggedMessagesFixture.ok());
    const view = renderPage(SettingsConversationsModerationPage, meta);
    expect(await view.findByText("Nothing waits for review")).toBeVisible();
    expect(view.getByText("No flagged messages")).toBeVisible();
    expect(view.getByText(/No board holds new posts/)).toBeVisible();
  });
});
