import { useRouterState } from "@tanstack/react-router";
import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createChangelogEntryFixture } from "../../api/team/create-changelog-entry.fixture";
import { getAssistantSettingsFixture } from "../../api/team/get-assistant-settings.fixture";
import { getChangelogEntryFixture } from "../../api/team/get-changelog-entry.fixture";
import { updateChangelogEntryFixture } from "../../api/team/update-changelog-entry.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import {
  TeamChangelogEntryPage,
  type TeamChangelogEntryPageProps,
} from "./team-changelog-entry-page";

const entry = getChangelogEntryFixture.ok({
  id: "entryId_test_1",
  title: "November release",
  content: "- Faster boards",
});
const saved = { timeout: 3000 };
const list = "/feedback/workspace_test_1/changelog";
let api: ReturnType<typeof mockApi>;

// Like the app route: the page gets the entry ID of the address, and a new ID does not
// mount it again. The page closes when the address leaves the editor.
function Routed(props: TeamChangelogEntryPageProps) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const entryId = path.split(`${list}/`)[1];
  return entryId ? (
    <TeamChangelogEntryPage {...props} params={{ ...props.params, entryId }} />
  ) : null;
}

/** Types a title and a body into a new entry, and holds its create request open. */
async function startNewEntry() {
  const api = mockApi();
  api.reply(getAssistantSettingsFixture.ok());
  const view = renderPage(Routed, meta, { params: { entryId: "new" } });
  let finish!: (body: unknown) => void;
  api.defer(({ resolve }) => (finish = resolve));
  const type = (name: string, value: string) =>
    fireEvent.change(view.getByRole("textbox", { name }), {
      target: { value },
    });
  type("Title", "December");
  type("Body", "Text");
  await waitFor(
    () => expect(api.calls("createQuillsChangelogEntry")).toHaveLength(1),
    saved,
  );
  // The user goes on typing while the create runs.
  type("Body", "Text and more");
  const created = createChangelogEntryFixture.ok({ id: "changelog_new" });
  return { api, view, finish: () => act(async () => finish(created)) };
}

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
        await waitFor(() => expect(view.queryClient.isMutating()).toBe(0));
        expect(view.getByText("Saved")).toBeInTheDocument();
        // The reply holds the full entry, so the page does not read it again.
        expect(api.calls("getQuillsChangelogEntry")).toHaveLength(1);
      },
    },
  });

  it("creates a new entry, moves to its address and keeps the text typed meanwhile", async () => {
    const { api, view, finish } = await startNewEntry();
    expect(api.calls("getQuillsChangelogEntry")).toHaveLength(0);
    // The page reads the new entry at its new address, then saves the newer text.
    api.reply(
      getChangelogEntryFixture.ok({
        id: "changelog_new",
        title: "December",
        content: "Text",
      }),
    );
    api.reply(updateChangelogEntryFixture.ok({ id: "changelog_new" }));
    await finish();
    await waitFor(
      () =>
        expect(view.router.state.location.pathname).toBe(
          `${list}/changelog_new`,
        ),
      saved,
    );
    await waitFor(
      () => expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
      saved,
    );
    expect(api.calls("getQuillsChangelogEntry")).toHaveLength(1);
    expect(await api.calls("updateQuillsChangelogEntry")[0]!.json()).toEqual({
      title: "December",
      content: "Text and more",
    });
    expect(view.getByRole("textbox", { name: "Body" })).toHaveValue(
      "Text and more",
    );
  });

  it("saves the change at once when the user goes back", async () => {
    const api = mockApi();
    api.reply(entry);
    api.reply(getAssistantSettingsFixture.ok());
    const view = renderPage(Routed, meta);
    fireEvent.change(await view.findByRole("textbox", { name: "Title" }), {
      target: { value: "November update" },
    });
    api.reply({ ...entry, title: "November update" });
    fireEvent.click(
      view.getByRole("button", { name: "Back to the changelog" }),
    );
    await waitFor(() => expect(view.router.state.location.pathname).toBe(list));
    expect(view.queryByRole("textbox", { name: "Title" })).toBeNull();
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsChangelogEntry")[0]!.json()).toEqual({
      title: "November update",
      content: "- Faster boards",
    });
  });

  it("keeps the user on the list when a create ends after they left", async () => {
    const { api, view, finish } = await startNewEntry();
    fireEvent.click(
      view.getByRole("button", { name: "Back to the changelog" }),
    );
    await waitFor(() => expect(view.router.state.location.pathname).toBe(list));
    const navigate = vi.spyOn(view.router, "navigate");
    api.reply(updateChangelogEntryFixture.ok({ id: "changelog_new" }));
    await finish();
    // The text typed during the create is saved to the new entry after it.
    await waitFor(
      () => expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
      saved,
    );
    expect(
      new URL(api.calls("updateQuillsChangelogEntry")[0]!.url).pathname,
    ).toBe("/api/quills/workspace_test_1/changelog/changelog_new");
    expect(navigate).not.toHaveBeenCalled();
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
