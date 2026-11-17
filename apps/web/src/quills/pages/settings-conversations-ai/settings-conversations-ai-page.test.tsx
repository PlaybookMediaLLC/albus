import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getAssistantSettingsFixture } from "../../api/team/get-assistant-settings.fixture";
import { updateAssistantSettingsFixture } from "../../api/team/update-assistant-settings.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { toast } from "../../ui/upstream";
import { meta } from "./meta";
import { SettingsConversationsAiPage } from "./settings-conversations-ai-page";

const settings = getAssistantSettingsFixture.ok({
  revision: 4,
  aiConfigured: true,
  identity: { name: "Ava" },
});

let api: ReturnType<typeof mockApi>;

describe("SettingsConversationsAiPage", () => {
  describePageContract(meta, SettingsConversationsAiPage, {
    loading: { prepare: () => mockApi().defer(() => undefined) },
    failed: { prepare: () => mockApi().fail() },
    ready: {
      prepare: () => mockApi().reply(settings),
      assert: async (view) => {
        expect(await view.findByLabelText("Name")).toHaveValue("Ava");
        expect(
          view.queryByText(/AI is not set up on this instance/),
        ).toBeNull();
      },
    },
    done: {
      prepare: () => {
        api = mockApi();
        api.reply(settings);
        api.reply(updateAssistantSettingsFixture.ok());
        api.reply({ ...settings, revision: 5 });
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("switch", { name: "Feedback posts" }),
        );
      },
      assert: async () => {
        await waitFor(() =>
          expect(api.calls("updateQuillsAssistantSettings")).toHaveLength(1),
        );
        expect(
          await api.calls("updateQuillsAssistantSettings")[0]!.json(),
        ).toEqual({
          revision: 4,
          agentKnowledge: { ...settings.agent.knowledge, posts: true },
        });
      },
    },
  });

  it("turns on the customer agent and saves the product description with the voice", async () => {
    api = mockApi();
    api.reply(settings);
    api.reply(updateAssistantSettingsFixture.ok());
    api.reply({ ...settings, revision: 5 });
    api.reply(updateAssistantSettingsFixture.ok());
    api.reply({ ...settings, revision: 6 });
    const view = renderPage(SettingsConversationsAiPage, meta);
    fireEvent.click(
      await view.findByRole("switch", { name: "Answer customers" }),
    );
    await waitFor(() =>
      expect(api.calls("updateQuillsAssistantSettings")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsAssistantSettings")[0]!.json()).toEqual(
      { revision: 4, agentEnabled: true },
    );
    await waitFor(() =>
      expect(api.calls("getQuillsAssistantSettings")).toHaveLength(2),
    );
    fireEvent.change(view.getByLabelText("About your product"), {
      target: { value: "A CSV exporter" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsAssistantSettings")).toHaveLength(2),
    );
    expect(
      await api.calls("updateQuillsAssistantSettings")[1]!.json(),
    ).toMatchObject({ revision: 5, agentProductDescription: "A CSV exporter" });
  });

  it("keeps the customer agent switch off without an AI provider", async () => {
    mockApi().reply({ ...settings, aiConfigured: false });
    const view = renderPage(SettingsConversationsAiPage, meta);
    expect(
      await view.findByRole("switch", { name: "Answer customers" }),
    ).toHaveAttribute("data-disabled");
  });

  it("says when the instance has no AI provider", async () => {
    mockApi().reply({ ...settings, aiConfigured: false });
    const view = renderPage(SettingsConversationsAiPage, meta);
    expect(
      await view.findByText(/AI is not set up on this instance/),
    ).toBeVisible();
  });

  it("reloads the settings when another person saved first", async () => {
    const error = vi.spyOn(toast, "error");
    api = mockApi();
    api.reply(settings);
    api.reply({ message: "Changed" }, 409);
    api.reply({ ...settings, revision: 5 });
    const view = renderPage(SettingsConversationsAiPage, meta);
    fireEvent.click(
      await view.findByRole("switch", { name: "Answer teammate questions" }),
    );
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "This changed before your request finished. Refresh and try again.",
      ),
    );
    expect(api.calls("getQuillsAssistantSettings")).toHaveLength(2);
  });

  it("keeps the unsaved text when a switch save changes the revision", async () => {
    api = mockApi();
    api.reply(settings);
    api.reply(updateAssistantSettingsFixture.ok());
    api.reply({ ...settings, revision: 5, copilot: { qa: true } });
    const view = renderPage(SettingsConversationsAiPage, meta);
    fireEvent.change(await view.findByLabelText("Name"), {
      target: { value: "Bob" },
    });
    fireEvent.click(
      view.getByRole("switch", { name: "Answer teammate questions" }),
    );
    await waitFor(() =>
      expect(api.calls("getQuillsAssistantSettings")).toHaveLength(2),
    );
    await waitFor(() =>
      expect(
        view.getByRole("switch", { name: "Answer teammate questions" }),
      ).toBeChecked(),
    );
    expect(view.getByLabelText("Name")).toHaveValue("Bob");
  });

  it("shows a voice conflict, keeps the text and saves with the new revision", async () => {
    api = mockApi();
    api.reply(settings);
    api.reply({ message: "Changed" }, 409);
    api.reply({ ...settings, revision: 5 });
    api.reply(updateAssistantSettingsFixture.ok());
    api.reply({ ...settings, revision: 6, identity: { name: "Bob" } });
    const view = renderPage(SettingsConversationsAiPage, meta);
    fireEvent.change(await view.findByLabelText("Name"), {
      target: { value: "Bob" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    expect(await view.findByRole("alert")).toHaveTextContent(
      "This changed before your request finished.",
    );
    expect(view.getByLabelText("Name")).toHaveValue("Bob");
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsAssistantSettings")).toHaveLength(2),
    );
    expect(
      await api.calls("updateQuillsAssistantSettings")[1]!.json(),
    ).toMatchObject({ revision: 5, name: "Bob" });
  });
});
