import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getChangelogEntryFixture } from "../../../api/team/get-changelog-entry.fixture";
import { listChangelogCategoriesFixture } from "../../../api/team/list-changelog-categories.fixture";
import { searchShippedPostsFixture } from "../../../api/team/search-shipped-posts.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../../team-member/member.fixture";
import { PublishPopover } from "./publish-popover";

const draft = getChangelogEntryFixture.ok({ id: "changelog_1" });

function open(entry = draft) {
  const api = mockApi();
  api.reply(listChangelogCategoriesFixture.ok());
  api.reply(searchShippedPostsFixture.ok());
  const view = renderComponent(
    inTeam(
      <PublishPopover
        workspaceId="workspace_test_1"
        entry={entry}
        onDeleted={() => undefined}
      />,
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
          onDeleted={() => undefined}
        />,
      ),
    );
    expect(view.getByRole("button", { name: /Draft/ })).toBeDisabled();
  });
});
