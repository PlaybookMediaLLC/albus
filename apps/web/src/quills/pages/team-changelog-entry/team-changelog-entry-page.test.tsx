import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createChangelogEntryFixture } from "../../api/team/create-changelog-entry.fixture";
import { getAssistantSettingsFixture } from "../../api/team/get-assistant-settings.fixture";
import { getChangelogEntryFixture } from "../../api/team/get-changelog-entry.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { TeamChangelogEntryPage } from "./team-changelog-entry-page";

const entry = getChangelogEntryFixture.ok({
  id: "entryId_test_1",
  title: "November release",
  content: "- Faster boards",
});
const saved = { timeout: 3000 };
let api: ReturnType<typeof mockApi>;

describe("TeamChangelogEntryPage", () => {
  describePageContract(meta, TeamChangelogEntryPage, {
    loading: {
      prepare: () => {
        mockApi().defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        mockApi().fail();
      },
    },
    ready: {
      prepare: () => {
        const api = mockApi();
        api.reply(entry);
        api.reply(getAssistantSettingsFixture.ok({ aiConfigured: true }));
      },
      assert: async (view) => {
        expect(await view.findByRole("textbox", { name: "Title" })).toHaveValue(
          "November release",
        );
        expect(
          await view.findByRole("button", { name: "Rewrite with AI" }),
        ).toBeInTheDocument();
        expect(view.getByRole("button", { name: /Draft/ })).toBeEnabled();
      },
    },
    done: {
      prepare: () => {
        api = mockApi();
        api.reply(entry);
        api.reply(getAssistantSettingsFixture.ok());
      },
      act: async (view) => {
        api.reply({ ...entry, title: "November update" });
        fireEvent.change(await view.findByRole("textbox", { name: "Title" }), {
          target: { value: "November update" },
        });
      },
      assert: async (view) => {
        await waitFor(
          () => expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
          saved,
        );
        expect(
          await api.calls("updateQuillsChangelogEntry")[0]!.json(),
        ).toEqual({ title: "November update", content: "- Faster boards" });
        expect(view.getByText("Saved")).toBeInTheDocument();
      },
    },
  });

  it("creates a new entry and moves to its address without losing the text", async () => {
    const api = mockApi();
    api.reply(getAssistantSettingsFixture.ok());
    const view = renderPage(TeamChangelogEntryPage, meta, {
      params: { entryId: "new" },
    });
    expect(api.calls("getQuillsChangelogEntry")).toHaveLength(0);
    api.reply(createChangelogEntryFixture.ok({ id: "changelog_new" }));
    api.reply(getChangelogEntryFixture.ok({ id: "changelog_new" }));
    fireEvent.change(view.getByRole("textbox", { name: "Title" }), {
      target: { value: "December" },
    });
    fireEvent.change(view.getByRole("textbox", { name: "Body" }), {
      target: { value: "Text" },
    });
    await waitFor(
      () =>
        expect(view.router.state.location.pathname).toBe(
          "/feedback/workspace_test_1/changelog/changelog_new",
        ),
      saved,
    );
    expect(view.getByRole("textbox", { name: "Title" })).toHaveValue(
      "December",
    );
  });

  it("shows a missing entry with a way back", async () => {
    mockApi().reply({ message: "Changelog entry not found" }, 404);
    const view = renderPage(TeamChangelogEntryPage, meta);
    expect(await view.findByRole("alert")).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "Back to the changelog" }),
    ).toBeInTheDocument();
  });
});
