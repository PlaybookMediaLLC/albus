import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createAdminAssistantTransformFixture } from "../../../api/team/create-admin-assistant-transform.fixture";
import { createChangelogEntryFixture } from "../../../api/team/create-changelog-entry.fixture";
import { getChangelogEntryFixture } from "../../../api/team/get-changelog-entry.fixture";
import { listChangelogCategoriesFixture } from "../../../api/team/list-changelog-categories.fixture";
import { searchShippedPostsFixture } from "../../../api/team/search-shipped-posts.fixture";
import { updateChangelogEntryFixture } from "../../../api/team/update-changelog-entry.fixture";
import type { TeamPermissions } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { inTeam } from "../../team-member/member.fixture";
import { EntryEditor } from "./entry-editor";

const saved = { timeout: 3000 };
const stored = getChangelogEntryFixture.ok({
  id: "changelog_1",
  title: "Stored",
  content: "Hello wrld",
});

function edit(
  entry: typeof stored | null = stored,
  permissions: Partial<TeamPermissions> = {},
  onCreated = () => undefined,
) {
  const view = renderComponent(
    inTeam(
      <EntryEditor
        workspaceId="workspace_test_1"
        entry={entry}
        aiOn
        onCreated={onCreated}
        onBack={() => undefined}
      />,
      permissions,
    ),
  );
  const type = (name: string, value: string) =>
    fireEvent.change(view.getByRole("textbox", { name }), {
      target: { value },
    });
  return Object.assign(view, { type });
}

describe("EntryEditor", () => {
  it("creates a new entry once, then updates it", async () => {
    const api = mockApi();
    const onCreated = vi.fn();
    const view = edit(null, {}, onCreated);
    view.type("Title", "November");
    const created = createChangelogEntryFixture.ok({ id: "changelog_new" });
    api.reply(created);
    view.type("Body", "- Faster boards");
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created), saved);
    expect(await api.calls("createQuillsChangelogEntry")[0]!.json()).toEqual({
      title: "November",
      content: "- Faster boards",
      publishState: { type: "draft" },
    });
    api.reply(getChangelogEntryFixture.ok({ id: "changelog_new" }));
    view.type("Title", "November release");
    await waitFor(
      () => expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
      saved,
    );
    expect(
      new URL(api.calls("updateQuillsChangelogEntry")[0]!.url).pathname,
    ).toBe("/api/quills/workspace_test_1/changelog/changelog_new");
    expect(api.calls("createQuillsChangelogEntry")).toHaveLength(1);
  });

  it("starts from the stored entry and shows the AI menu when AI is on", () => {
    mockApi();
    const view = edit();
    expect(view.getByRole("textbox", { name: "Title" })).toHaveValue("Stored");
    expect(view.getByRole("textbox", { name: "Body" })).toHaveValue(
      "Hello wrld",
    );
    expect(
      view.getByRole("button", { name: "Rewrite with AI" }),
    ).toBeInTheDocument();
  });

  it("keeps the text read-only without the permission to save it", () => {
    mockApi();
    for (const [entry, permissions] of [
      [stored, { update: false }],
      [null, { create: false }],
    ] as const) {
      const view = edit(entry, permissions);
      for (const name of ["Title", "Body"])
        expect(view.getByRole("textbox", { name })).toHaveAttribute("readonly");
      expect(
        view.queryByRole("button", { name: "Rewrite with AI" }),
      ).toBeNull();
      view.unmount();
    }
  });

  it("says why a new entry is not saved yet instead of saved", async () => {
    const api = mockApi();
    const view = edit(null);
    expect(view.getByText("Not saved yet. Add a title.")).toBeInTheDocument();
    view.type("Title", "December");
    expect(
      view.getByText("Not saved yet. Add text to the body."),
    ).toBeInTheDocument();
    expect(view.queryByText("Saved")).toBeNull();
    expect(api.calls()).toHaveLength(0);
  });

  it("shows the API problem of a failed save and announces it", async () => {
    const error = vi.spyOn(toast, "error");
    const api = mockApi();
    api.reply({ message: "Changed elsewhere" }, 409);
    const view = edit();
    view.type("Title", "Changed");
    expect(
      await view.findByRole("button", { name: "Not saved. Try again." }, saved),
    ).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith(
      "Not saved. The entry changed in a different place. Reload the page and try again.",
      { description: undefined },
    );
    expect(view.getByRole("status")).toHaveTextContent("Not saved. Try again.");
    // The editor tries again when it closes.
    api.reply(updateChangelogEntryFixture.ok({ id: "changelog_1" }));
  });

  it("publishes only after the text that the user typed is saved", async () => {
    const api = mockApi();
    api.reply(listChangelogCategoriesFixture.ok());
    api.reply(searchShippedPostsFixture.ok());
    const view = edit();
    fireEvent.click(view.getByRole("button", { name: /Draft/ }));
    await waitFor(() => expect(api.calls()).toHaveLength(2));
    view.type("Title", "Changed");
    api.reply(updateChangelogEntryFixture.ok({ id: "changelog_1" }));
    api.reply(updateChangelogEntryFixture.ok({ id: "changelog_1" }));
    fireEvent.click(await view.findByRole("button", { name: "Publish" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(2),
    );
    const [text, publish] = api.calls("updateQuillsChangelogEntry");
    expect(await text!.json()).toEqual({
      title: "Changed",
      content: "Hello wrld",
    });
    expect(await publish!.json()).toEqual({
      publishState: { type: "published" },
      notify: true,
    });
  });

  it("applies an AI rewrite only where the text did not change", async () => {
    const error = vi.spyOn(toast, "error");
    const api = mockApi();
    const view = edit();
    const body = view.getByRole("textbox", { name: "Body" });
    const rewrite = async (count: number) => {
      (body as HTMLTextAreaElement).setSelectionRange(6, 10);
      let finish!: (reply: unknown) => void;
      api.defer(({ resolve }) => (finish = resolve));
      fireEvent.click(view.getByRole("button", { name: "Rewrite with AI" }));
      fireEvent.click(
        await view.findByRole("menuitem", { name: "Fix grammar" }),
      );
      await waitFor(() =>
        expect(api.calls("createQuillsAdminAssistantTransform")).toHaveLength(
          count,
        ),
      );
      return () =>
        finish(createAdminAssistantTransformFixture.ok({ text: "world" }));
    };
    const stale = await rewrite(1);
    // The user types while the rewrite runs.
    view.type("Body", "Oh, Hello wrld");
    stale();
    fireEvent.click(await view.findByRole("button", { name: "Replace" }));
    expect(error).toHaveBeenCalledWith(
      "The text changed during the rewrite. Select the text again and try again.",
    );
    expect(body).toHaveValue("Oh, Hello wrld");
    view.type("Body", "Hello wrld");
    const fresh = await rewrite(2);
    fresh();
    fireEvent.click(await view.findByRole("button", { name: "Replace" }));
    expect(body).toHaveValue("Hello world");
    // The editor sends the rewrite when it closes.
    api.reply(updateChangelogEntryFixture.ok({ id: "changelog_1" }));
  });
});
