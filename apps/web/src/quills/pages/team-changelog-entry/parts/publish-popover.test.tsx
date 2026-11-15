import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getChangelogEntryFixture } from "../../../api/team/get-changelog-entry.fixture";
import { listChangelogCategoriesFixture } from "../../../api/team/list-changelog-categories.fixture";
import { searchShippedPostsFixture } from "../../../api/team/search-shipped-posts.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import type { TeamPermissions } from "../../../team/runtime";
import { toast } from "../../../ui/upstream";
import { inTeam } from "../../team-member/member.fixture";
import { PublishPopover } from "./publish-popover";

const draft = getChangelogEntryFixture.ok({ id: "changelog_1" });

function open(
  entry = draft,
  flush = async () => true,
  permissions: Partial<TeamPermissions> = {},
) {
  const api = mockApi();
  api.reply(listChangelogCategoriesFixture.ok());
  api.reply(searchShippedPostsFixture.ok());
  const view = renderComponent(
    inTeam(
      <PublishPopover
        workspaceId="workspace_test_1"
        entry={entry}
        flush={flush}
        onDeleted={() => undefined}
      />,
      permissions,
    ),
  );
  fireEvent.click(view.getByRole("button", { name: /^(Draft|Published)/ }));
  return { api, view };
}

describe("PublishPopover", () => {
  it("schedules with the chosen time and the notify switch", async () => {
    const { api, view } = open();
    // The field shortens the long portal URL and keeps its end.
    expect(await view.findByRole("group", { name: "Link" })).toHaveTextContent(
      /changelog_1$/,
    );
    fireEvent.click(view.getByRole("button", { name: "Later" }));
    const schedule = view.getByRole("button", { name: "Schedule" });
    expect(schedule).toBeDisabled();
    fireEvent.change(view.getByLabelText("Date"), {
      target: { value: "2030-01-02T09:30" },
    });
    api.reply(draft);
    fireEvent.click(schedule);
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsChangelogEntry")[0]!.json()).toEqual({
      publishState: {
        type: "scheduled",
        publishAt: new Date("2030-01-02T09:30").toISOString(),
      },
      notify: true,
    });
  });

  it("publishes only after the pending text is saved", async () => {
    let save!: (stored: boolean) => void;
    const flush = vi.fn(
      () => new Promise<boolean>((resolve) => (save = resolve)),
    );
    const { api, view } = open(draft, flush);
    fireEvent.click(await view.findByRole("button", { name: "Publish" }));
    await waitFor(() => expect(flush).toHaveBeenCalledTimes(1));
    expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(0);
    api.reply(draft);
    save(true);
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsChangelogEntry")[0]!.json()).toEqual({
      publishState: { type: "published" },
      notify: true,
    });
  });

  it("does not publish text that is not saved", async () => {
    const error = vi.spyOn(toast, "error");
    const { api, view } = open(draft, async () => false);
    fireEvent.click(await view.findByRole("button", { name: "Publish" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "The entry is not published because the text is not saved.",
      ),
    );
    expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(0);
  });

  it("keeps the publish date when it updates a published entry", async () => {
    const publishedAt = "2026-01-05T10:00:00.000Z";
    const { api, view } = open({ ...draft, status: "published", publishedAt });
    api.reply(draft);
    fireEvent.click(await view.findByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsChangelogEntry")[0]!.json()).toEqual({
      publishState: { type: "published", publishAt: publishedAt },
      notify: true,
    });
  });

  it("disables publish, unpublish, details and delete without the permissions", async () => {
    const { view } = open({ ...draft, status: "published" }, undefined, {
      update: false,
      delete: false,
    });
    expect(await view.findByRole("button", { name: "Update" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Unpublish" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Add tags" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Link requests" })).toBeDisabled();
    expect(
      view.getByRole("switch", { name: "Notify subscribers" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(view.getByRole("button", { name: "Delete entry" })).toBeDisabled();
  });

  it("updates or unpublishes a published entry", async () => {
    const { api, view } = open({ ...draft, status: "published" });
    expect(await view.findByRole("button", { name: "Update" })).toBeEnabled();
    api.reply(draft);
    fireEvent.click(view.getByRole("button", { name: "Unpublish" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsChangelogEntry")[0]!.json()).toEqual({
      publishState: { type: "draft" },
    });
  });

  it("cannot open before the first save", () => {
    mockApi();
    const view = renderComponent(
      inTeam(
        <PublishPopover
          workspaceId="workspace_test_1"
          entry={null}
          flush={async () => true}
          onDeleted={() => undefined}
        />,
      ),
    );
    expect(view.getByRole("button", { name: /Draft/ })).toBeDisabled();
  });
});
