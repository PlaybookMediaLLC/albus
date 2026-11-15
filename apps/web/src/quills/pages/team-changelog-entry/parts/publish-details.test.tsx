import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getChangelogEntryFixture } from "../../../api/team/get-changelog-entry.fixture";
import { listChangelogCategoriesFixture } from "../../../api/team/list-changelog-categories.fixture";
import { searchShippedPostsFixture } from "../../../api/team/search-shipped-posts.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../../team-member/member.fixture";
import { PublishDetails } from "./publish-details";

const entry = getChangelogEntryFixture.ok({
  id: "changelog_1",
  author: { id: "principal_1", name: "Grace", avatarUrl: null },
  categories: [{ id: "category_fix", name: "Fix", color: "gray" }],
});

const category = {
  id: "",
  name: "",
  color: "gray",
  segmentIds: [],
  position: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("PublishDetails", () => {
  it("shows the author and saves the full tag list on a change", async () => {
    const api = mockApi();
    api.reply(
      listChangelogCategoriesFixture.ok({
        categories: [
          { ...category, id: "category_fix", name: "Fix" },
          { ...category, id: "category_new", name: "New", position: 1 },
        ],
      }),
    );
    api.reply(searchShippedPostsFixture.ok());
    const onNotifyChange = vi.fn();
    const view = renderComponent(
      inTeam(
        <PublishDetails
          workspaceId="workspace_test_1"
          entry={entry}
          notify
          onNotifyChange={onNotifyChange}
        />,
      ),
    );
    expect(view.getByText("Grace")).toBeInTheDocument();
    api.reply(entry);
    fireEvent.click(view.getByRole("button", { name: /Fix/ }));
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: "New" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsChangelogEntry")[0]!.json()).toEqual({
      categoryIds: ["category_fix", "category_new"],
    });
    fireEvent.click(view.getByRole("switch", { name: "Notify subscribers" }));
    expect(onNotifyChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("waits for one tag change before the next one", async () => {
    const api = mockApi();
    api.reply(
      listChangelogCategoriesFixture.ok({
        categories: [
          { ...category, id: "category_fix", name: "Fix" },
          { ...category, id: "category_new", name: "New", position: 1 },
        ],
      }),
    );
    api.reply(searchShippedPostsFixture.ok());
    let finish!: (body: unknown) => void;
    api.defer(({ resolve }) => (finish = resolve));
    const view = renderComponent(
      inTeam(
        <PublishDetails
          workspaceId="workspace_test_1"
          entry={entry}
          notify
          onNotifyChange={() => undefined}
        />,
      ),
    );
    fireEvent.click(view.getByRole("button", { name: /Fix/ }));
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: "New" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogEntry")).toHaveLength(1),
    );
    // A second click now would send a list without the first change.
    expect(view.getByRole("menuitemcheckbox", { name: "Fix" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    finish(entry);
    await waitFor(() =>
      expect(
        view.getByRole("menuitemcheckbox", { name: "Fix" }),
      ).not.toHaveAttribute("aria-disabled", "true"),
    );
  });
});
