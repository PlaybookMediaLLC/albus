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
});
