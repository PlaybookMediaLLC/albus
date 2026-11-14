import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { mergePostFixture } from "../../../api/team/merge-post.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inboxPosts, inboxStatuses } from "../../team-posts/inbox.fixture";
import { postDetail, postTeam } from "../post.fixture";
import { MergePalette } from "./merge-palette";

describe("MergePalette", () => {
  it("merges the chosen request into this one in the here mode", async () => {
    const api = mockApi();
    api.reply(inboxPosts);
    api.reply(mergePostFixture.ok());
    const onClose = vi.fn();
    const view = renderComponent(
      <TeamRuntimeProvider value={postTeam}>
        <MergePalette
          workspaceId="workspace_test_1"
          post={postDetail}
          statuses={inboxStatuses.statuses}
          mode="here"
          onClose={onClose}
        />
      </TeamRuntimeProvider>,
    );
    expect(view.getByText("Merge here")).toBeVisible();
    fireEvent.change(
      view.getByRole("combobox", { name: "Find the request to merge here…" }),
      { target: { value: "sign" } },
    );
    fireEvent.click(
      await view.findByRole("option", { name: /Single sign-on/ }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(new URL(api.calls("mergeQuillsPost")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_sso/merge",
    );
    await expect(
      api.calls("mergeQuillsPost")[0]!.clone().json(),
    ).resolves.toEqual({ canonicalPostId: "post_export" });
  });

  const renderInto = () =>
    renderComponent(
      <TeamRuntimeProvider value={postTeam}>
        <MergePalette
          workspaceId="workspace_test_1"
          post={postDetail}
          statuses={inboxStatuses.statuses}
          mode="into"
          onClose={vi.fn()}
        />
      </TeamRuntimeProvider>,
    );
  const type = (view: ReturnType<typeof renderInto>, text: string) =>
    fireEvent.change(
      view.getByRole("combobox", {
        name: "Find the request to merge this into…",
      }),
      { target: { value: text } },
    );

  it("waits for the first search before it says there are no results", async () => {
    const api = mockApi();
    api.reply({ ...inboxPosts, items: [] });
    const view = renderInto();
    type(view, "zzz");
    // The search waits for the debounce, so nothing says "No results" yet.
    expect(view.queryByText("No results")).toBeNull();
    expect(await view.findByText("No results")).toBeVisible();
    expect(api.calls("listQuillsPosts")).toHaveLength(1);
  });

  it("shows a failed search with a retry, not No results", async () => {
    const api = mockApi();
    api.fail();
    api.reply(inboxPosts);
    const view = renderInto();
    type(view, "sign");
    const dialog = await view.findByRole("dialog", { name: "Merge into" });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /went wrong/i,
    );
    expect(view.queryByText("No results")).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Try again" }));
    expect(
      await view.findByRole("option", { name: /Single sign-on/ }),
    ).toBeVisible();
  });
});
