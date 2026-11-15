import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { listConversationTagUsageFixture } from "../../api/team/list-conversation-tag-usage.fixture";
import { listConversationTagsFixture } from "../../api/team/list-conversation-tags.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { toast } from "../../ui/upstream";
import { meta } from "./meta";
import { SettingsConversationsTopicsPage } from "./settings-conversations-topics-page";

const billing = { id: "tag_1", name: "Billing", color: "#3b82f6", count: 3 };
const tags = listConversationTagsFixture.ok({ items: [billing] });
const noTags = listConversationTagsFixture.ok();
const live = listConversationTagUsageFixture.ok({
  items: [{ ...billing, archived: false }],
});
const archived = listConversationTagUsageFixture.ok({
  items: [{ ...billing, archived: true }],
});

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(tags);
  api.reply(live);
};
const openAction = async (
  view: ReturnType<typeof renderPage>,
  action: string,
) => {
  fireEvent.click(
    await view.findByRole("button", { name: "Actions for Billing" }),
  );
  fireEvent.click(await view.findByRole("menuitem", { name: action }));
};

describe("SettingsConversationsTopicsPage", () => {
  describePageContract(meta, SettingsConversationsTopicsPage, {
    loading: { prepare: () => mockApi().defer(() => undefined) },
    failed: { prepare: () => mockApi().fail() },
    ready: {
      prepare: ready,
      assert: async (view) => {
        expect(await view.findByText("Billing")).toBeVisible();
        expect(view.getByText("3 open")).toBeVisible();
        expect(new URL(api.calls()[0]!.url).search).toBe("?counts=true");
      },
    },
    done: {
      prepare: () => {
        ready();
        api.reply({ id: "tag_1", name: "Billing", color: "#3b82f6" });
        api.reply(noTags);
        api.reply(archived);
      },
      act: async (view) => openAction(view, "Archive"),
      assert: async () => {
        await waitFor(() =>
          expect(api.calls("archiveQuillsConversationTag")).toHaveLength(1),
        );
      },
    },
  });

  it("shows an existing name at the field", async () => {
    ready();
    api.reply({ ...billing, created: false });
    const view = renderPage(SettingsConversationsTopicsPage, meta);
    fireEvent.click(await view.findByRole("button", { name: "New topic" }));
    const dialog = await view.findByRole("dialog", { name: "New topic" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "billing" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "A topic with this name exists.",
    );
  });

  it("archives, then deletes the topic for good", async () => {
    ready();
    // Each write refetches both lists before the next write starts.
    api.reply({ id: "tag_1", name: "Billing", color: "#3b82f6" });
    api.reply(noTags);
    api.reply(archived);
    api.reply({ id: "tag_1" });
    api.reply(noTags);
    api.reply(listConversationTagUsageFixture.ok());
    const view = renderPage(SettingsConversationsTopicsPage, meta);
    await openAction(view, "Delete topic");
    const dialog = await view.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete topic" }),
    );
    await waitFor(() =>
      expect(api.calls("deleteQuillsConversationTag")).toHaveLength(1),
    );
    expect(api.calls("archiveQuillsConversationTag")).toHaveLength(1);
  });

  it("lists an archived topic and restores it", async () => {
    api = mockApi();
    api.reply(noTags);
    api.reply(archived);
    api.reply({ id: "tag_1", name: "Billing", color: "#3b82f6" });
    api.reply(tags);
    api.reply(live);
    const view = renderPage(SettingsConversationsTopicsPage, meta);
    fireEvent.click(
      await view.findByRole("button", { name: "Restore Billing" }),
    );
    expect(await view.findByText("3 open")).toBeVisible();
    expect(api.calls("restoreQuillsConversationTag")).toHaveLength(1);
    expect(view.queryByText("Archived topics")).toBeNull();
  });

  it("keeps a topic that failed to delete under the archived topics", async () => {
    const error = vi.spyOn(toast, "error");
    ready();
    api.reply({ id: "tag_1", name: "Billing", color: "#3b82f6" });
    api.reply(noTags);
    api.reply(archived);
    api.reply({ message: "In use" }, 409);
    const view = renderPage(SettingsConversationsTopicsPage, meta);
    await openAction(view, "Delete topic");
    const dialog = await view.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete topic" }),
    );
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "The topic could not be deleted. A workflow or a macro may still use it.",
      ),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(
      await view.findByRole("button", { name: "Restore Billing" }),
    ).toBeVisible();
  });

  it("does not read the archived topics without manage_settings", async () => {
    api = mockApi();
    api.reply(tags);
    const view = renderPage(SettingsConversationsTopicsPage, meta, {
      permissions: { manageSettings: false },
    });
    expect(await view.findByText("Billing")).toBeVisible();
    expect(api.calls("listQuillsConversationTagUsage")).toHaveLength(0);
  });

  it("says why a topic in use cannot be archived", async () => {
    const error = vi.spyOn(toast, "error");
    ready();
    api.reply({ message: "In use" }, 409);
    const view = renderPage(SettingsConversationsTopicsPage, meta);
    await openAction(view, "Archive");
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "The topic could not be archived. A workflow or a macro may still use it.",
      ),
    );
  });
});
