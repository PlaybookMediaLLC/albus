import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createChangelogEntryFixture } from "../../../api/team/create-changelog-entry.fixture";
import { getChangelogEntryFixture } from "../../../api/team/get-changelog-entry.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../../team-member/member.fixture";
import { EntryEditor } from "./entry-editor";

const saved = { timeout: 3000 };

describe("EntryEditor", () => {
  it("creates a new entry once, then updates it", async () => {
    const api = mockApi();
    const onCreated = vi.fn();
    const view = renderComponent(
      inTeam(
        <EntryEditor
          workspaceId="workspace_test_1"
          entry={null}
          aiOn={false}
          onCreated={onCreated}
          onBack={() => undefined}
        />,
      ),
    );
    fireEvent.change(view.getByRole("textbox", { name: "Title" }), {
      target: { value: "November" },
    });
    const created = createChangelogEntryFixture.ok({ id: "changelog_new" });
    api.reply(created);
    fireEvent.change(view.getByRole("textbox", { name: "Body" }), {
      target: { value: "- Faster boards" },
    });
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created), saved);
    expect(await api.calls("createQuillsChangelogEntry")[0]!.json()).toEqual({
      title: "November",
      content: "- Faster boards",
      publishState: { type: "draft" },
    });
    api.reply(getChangelogEntryFixture.ok({ id: "changelog_new" }));
    fireEvent.change(view.getByRole("textbox", { name: "Title" }), {
      target: { value: "November release" },
    });
    await waitFor(
      () => expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
      saved,
    );
    expect(
      new URL(api.calls("updateQuillsChangelogEntry")[0]!.url).pathname,
    ).toBe("/api/quills/workspace_test_1/changelog/changelog_new");
    expect(api.calls("createQuillsChangelogEntry")).toHaveLength(1);
  });

  it("starts from the stored entry and shows the AI menu only when AI is on", () => {
    mockApi();
    const view = renderComponent(
      inTeam(
        <EntryEditor
          workspaceId="workspace_test_1"
          entry={getChangelogEntryFixture.ok({
            title: "Stored",
            content: "Body",
          })}
          aiOn
          onCreated={() => undefined}
          onBack={() => undefined}
        />,
      ),
    );
    expect(view.getByRole("textbox", { name: "Title" })).toHaveValue("Stored");
    expect(view.getByRole("textbox", { name: "Body" })).toHaveValue("Body");
    expect(
      view.getByRole("button", { name: "Rewrite with AI" }),
    ).toBeInTheDocument();
  });
});
