import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { restorePostFixture } from "../../../api/team/restore-post.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { postTeam } from "../../team-post/post.fixture";
import { inboxBoards, inboxPosts, inboxStatuses } from "../inbox.fixture";
import { rowContext } from "../post-list";
import { DeletedRequest } from "./deleted-request";

const post = { ...inboxPosts.items[0]!, deletedAt: "2026-11-01T00:00:00.000Z" };
const context = rowContext(inboxStatuses.statuses, inboxBoards.items, (key) =>
  key === "team-posts.anonymous" ? "Anonymous" : key,
);
const render = (remove = true) =>
  renderComponent(
    <TeamRuntimeProvider
      value={{
        ...postTeam,
        permissions: { ...postTeam.permissions, delete: remove },
      }}
    >
      <DeletedRequest post={post} context={context} />
    </TeamRuntimeProvider>,
  );

describe("DeletedRequest", () => {
  it("shows the title, the board and the delete date, and is not a link", () => {
    const view = render();
    expect(view.getByText("Export to CSV")).toBeVisible();
    expect(view.getByText("Ideas")).toBeVisible();
    expect(view.getByText(/^Deleted /)).toBeVisible();
    expect(view.queryByRole("link")).toBeNull();
  });

  it("confirms a restore after the row leaves the list", async () => {
    const success = vi.spyOn(toast, "success");
    const api = mockApi();
    let finish!: (body: unknown) => void;
    api.defer(({ resolve }) => {
      finish = resolve;
    });
    const view = render();
    fireEvent.click(
      view.getByRole("button", { name: "Restore Export to CSV" }),
    );
    await waitFor(() => expect(api.calls("restoreQuillsPost")).toHaveLength(1));
    // The refreshed list drops the row before the restore ends.
    view.unmount();
    finish(restorePostFixture.ok({ id: "post_export" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("Restored “Export to CSV”."),
    );
    success.mockRestore();
  });

  it("explains a failed restore", async () => {
    const api = mockApi();
    api.reply({ message: "Post is not deleted" }, 409);
    const view = render();
    fireEvent.click(
      view.getByRole("button", { name: "Restore Export to CSV" }),
    );
    expect(await view.findByRole("alert")).toHaveTextContent(
      /changed before your request finished/,
    );
    expect(api.calls("restoreQuillsPost")).toHaveLength(1);
  });

  it("offers no Restore without the delete permission", () => {
    const view = render(false);
    expect(view.queryByRole("button")).toBeNull();
  });
});
