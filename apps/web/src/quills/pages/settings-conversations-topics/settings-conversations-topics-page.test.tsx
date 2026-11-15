import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { listConversationTagsFixture } from "../../api/team/list-conversation-tags.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { toast } from "../../ui/upstream";
import { meta } from "./meta";
import { SettingsConversationsTopicsPage } from "./settings-conversations-topics-page";

const billing = { id: "tag_1", name: "Billing", color: "#3b82f6", count: 3 };
const tags = listConversationTagsFixture.ok({ items: [billing] });

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(tags);
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
        api.reply(listConversationTagsFixture.ok());
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
    // Each write refetches the list before the next write starts.
    api.reply({ id: "tag_1", name: "Billing", color: "#3b82f6" });
    api.reply(listConversationTagsFixture.ok());
    api.reply({ id: "tag_1" });
    api.reply(listConversationTagsFixture.ok());
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
