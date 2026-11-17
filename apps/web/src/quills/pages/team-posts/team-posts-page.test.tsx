import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPostFixture } from "../../api/team/create-post.fixture";
import { createPostViewFixture } from "../../api/team/create-post-view.fixture";
import { listPostViewsFixture } from "../../api/team/list-post-views.fixture";
import type { ListPostsResponse } from "../../api/team/list-posts";
import { listPostsFixture } from "../../api/team/list-posts.fixture";
import { listUsersFixture } from "../../api/team/list-users.fixture";
import { restorePostFixture } from "../../api/team/restore-post.fixture";
import { choose, fill, press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { ShortcutListener } from "../../ui/upstream";
import {
  inboxBoards,
  inboxCustomer,
  inboxPosts,
  inboxStatuses,
  inboxTags,
} from "./inbox.fixture";
import { meta } from "./meta";
import { TeamPostsPage, type TeamPostsPageProps } from "./team-posts-page";

// The statuses and boards load first; the posts wait for the statuses.
const prepare = (posts: ListPostsResponse = inboxPosts) => {
  const api = mockApi();
  api.reply(inboxStatuses);
  api.reply(inboxBoards);
  api.reply(posts);
  return api;
};
// The New request modal opens with the statuses and boards, so its tags load before the posts.
const creating = () => {
  const api = mockApi();
  api.reply(inboxStatuses);
  api.reply(inboxBoards);
  api.reply(inboxTags);
  api.reply(inboxPosts);
  return api;
};
const createFlow = async (view: ReturnType<typeof renderPage>) => {
  await view.findByRole("dialog");
  fill("Request title", "Dark mode");
  fill("Add details", "For the **night** shift.");
  press("Create");
};

describe("TeamPostsPage", () => {
  describePageContract(meta, TeamPostsPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 2; index++) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        api.fail();
        api.reply(inboxBoards);
      },
    },
    empty: { prepare: () => void prepare(listPostsFixture.ok()) },
    ready: { prepare: () => void prepare() },
    done: {
      prepare: () => {
        const api = creating();
        api.reply(createPostFixture.ok({ id: "post_dark" }));
        return { search: { new: true } };
      },
      act: async (view) => {
        await createFlow(view);
        await waitFor(() =>
          expect(view.router.state.location.pathname).toBe(
            "/feedback/workspace_test_1/posts/post_dark",
          ),
        );
      },
    },
  });

  it("groups the open posts by status with the row details", async () => {
    const api = prepare({
      ...inboxPosts,
      items: [
        { ...inboxPosts.items[0]!, updatedAt: "2020-01-01T00:00:00.000Z" },
        inboxPosts.items[1]!,
      ],
    });
    const view = renderPage(TeamPostsPage, meta);
    const list = await view.findByRole("region", { name: "Requests" });
    const open = within(list).getByRole("group", { name: /^Open/ });
    const row = within(open).getByRole("link", { name: /Export to CSV/ });
    expect(row).toHaveTextContent("3 votes");
    expect(row).toHaveTextContent("Ideas");
    expect(row).toHaveTextContent(/Stale \d+mo/);
    expect(row).not.toHaveTextContent("Export to CSV details");
    expect(within(list).getByRole("group", { name: /^Planned/ })).toBeVisible();
    expect(
      view.getByRole("heading", { level: 1, name: "Requests" }),
    ).toBeVisible();
    const query = new URL(api.calls("listQuillsPosts")[0]!.url).searchParams;
    expect(query.get("statusIds")).toBe("status_open,status_planned");
    expect(query.get("sort")).toBe("newest");
  });

  it("keeps the filters in the address and opens a post with them", async () => {
    prepare();
    const view = renderPage(TeamPostsPage, meta, {
      search: { board: "board_ideas", sort: "votes" },
    });
    const row = await view.findByRole("link", { name: /Export to CSV/ });
    expect(row.getAttribute("href")).toContain(
      "/feedback/workspace_test_1/posts/post_export?",
    );
    fireEvent.click(row);
    await waitFor(() =>
      expect(view.router.state.location.pathname).toBe(
        "/feedback/workspace_test_1/posts/post_export",
      ),
    );
    expect(view.router.state.location.search).toEqual({
      board: "board_ideas",
      sort: "votes",
    });
  });

  // Opening the filter menu loads the tags, then the saved views.
  const openFilters = async (
    api: ReturnType<typeof prepare>,
    views = listPostViewsFixture.ok(),
  ) => {
    api.reply(inboxTags);
    api.reply(views);
    press("Filters");
  };
  const submenu = async (view: ReturnType<typeof renderPage>, name: string) =>
    fireEvent.click(await view.findByRole("menuitem", { name }));

  it("shows one sidebar status by name and adds a status from the filter menu", async () => {
    const api = prepare();
    const view = renderPage(TeamPostsPage, meta, {
      search: { statusId: "status_planned" },
    });
    expect(
      await view.findByRole("heading", { level: 1, name: "Planned" }),
    ).toBeVisible();
    await openFilters(api);
    await submenu(view, "Status");
    fireEvent.click(
      await view.findByRole("menuitemcheckbox", { name: "Open" }),
    );
    await waitFor(() =>
      expect(view.router.state.location.search).toEqual({
        statusId: "status_planned,status_open",
      }),
    );
  });

  const deletedPosts = {
    ...inboxPosts,
    items: [{ ...inboxPosts.items[0]!, deletedAt: "2026-11-01T00:00:00.000Z" }],
  };

  it("offers the deleted requests in the filter menu", async () => {
    const api = prepare();
    const view = renderPage(TeamPostsPage, meta);
    await view.findByRole("link", { name: /Export to CSV/ });
    await openFilters(api);
    await submenu(view, "Status");
    fireEvent.click(
      await view.findByRole("menuitemcheckbox", { name: "Deleted" }),
    );
    await waitFor(() =>
      expect(view.router.state.location.search).toEqual({ status: "deleted" }),
    );
  });

  it("filters by a tag", async () => {
    const api = prepare();
    const view = renderPage(TeamPostsPage, meta);
    await view.findByRole("link", { name: /Export to CSV/ });
    await openFilters(api);
    await submenu(view, "Tags");
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: "UX" }));
    await waitFor(() =>
      expect(view.router.state.location.search).toEqual({ tags: "tag_ux" }),
    );
  });

  it("sends the tag filter and saves the filters as a view", async () => {
    const api = prepare();
    const view = renderPage(TeamPostsPage, meta, {
      search: { tags: "tag_ux" },
    });
    await view.findByRole("link", { name: /Export to CSV/ });
    expect(
      new URL(api.calls("listQuillsPosts")[0]!.url).searchParams.get("tagIds"),
    ).toBe("tag_ux");
    await openFilters(api);
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Save as view…" }),
    );
    await view.findByRole("dialog");
    fill("Name", "UX asks");
    api.reply(createPostViewFixture.ok());
    press("Save view");
    await waitFor(() =>
      expect(api.calls("createQuillsPostView")).toHaveLength(1),
    );
    await expect(
      api.calls("createQuillsPostView")[0]!.clone().json(),
    ).resolves.toEqual({
      name: "UX asks",
      filters: { status: ["status_open", "status_planned"], tags: ["tag_ux"] },
    });
  });

  it("opens a saved view", async () => {
    const api = prepare();
    const view = renderPage(TeamPostsPage, meta);
    await view.findByRole("link", { name: /Export to CSV/ });
    await openFilters(
      api,
      listPostViewsFixture.ok({
        views: [
          {
            id: "view_top",
            name: "Top ideas",
            isShared: true,
            mine: true,
            filters: { board: ["board_ideas"], sort: "votes" },
          },
        ],
      }),
    );
    await submenu(view, "Views");
    fireEvent.click(await view.findByRole("menuitem", { name: "Top ideas" }));
    await waitFor(() =>
      expect(view.router.state.location.search).toEqual({
        status: "all",
        board: "board_ideas",
        sort: "votes",
      }),
    );
  });

  it("lists the deleted requests and restores one", async () => {
    const api = prepare(deletedPosts);
    api.reply(restorePostFixture.ok({ id: "post_export" }));
    // The restore refreshes the list, which no longer has the request.
    api.reply(listPostsFixture.ok());
    const view = renderPage(TeamPostsPage, meta, {
      search: { status: "deleted" },
    });
    expect(
      await view.findByRole("heading", { level: 1, name: "Deleted" }),
    ).toBeVisible();
    const restore = await view.findByRole("button", {
      name: "Restore Export to CSV",
    });
    const query = new URL(api.calls("listQuillsPosts")[0]!.url).searchParams;
    expect(query.get("showDeleted")).toBe("true");
    expect(query.get("statusIds")).toBeNull();
    // A deleted request does not open.
    expect(view.queryByRole("link", { name: /Export to CSV/ })).toBeNull();
    fireEvent.click(restore);
    await waitFor(() => expect(api.calls("restoreQuillsPost")).toHaveLength(1));
    expect(new URL(api.calls("restoreQuillsPost")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/restore",
    );
    expect(await view.findByText("Nothing is here yet.")).toBeVisible();
  });

  it("does not open a deleted request by key", async () => {
    prepare(deletedPosts);
    // The keys need the shortcut listener of the app shell.
    function WithKeys(props: TeamPostsPageProps) {
      return (
        <>
          <ShortcutListener />
          <TeamPostsPage {...props} />
        </>
      );
    }
    const view = renderPage(WithKeys, meta, {
      search: { status: "deleted" },
    });
    await view.findByRole("button", { name: "Restore Export to CSV" });
    const navigate = vi.spyOn(view.router, "navigate");
    fireEvent.keyDown(document.body, { key: "j" });
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("offers Restore only with the delete permission", async () => {
    prepare(deletedPosts);
    const view = renderPage(TeamPostsPage, meta, {
      search: { status: "deleted" },
      permissions: { delete: false },
    });
    expect(await view.findByText("Export to CSV")).toBeVisible();
    expect(view.queryByRole("button", { name: /^Restore/ })).toBeNull();
  });

  it("puts the typed search in the address", async () => {
    prepare();
    const view = renderPage(TeamPostsPage, meta);
    await view.findByRole("region", { name: "Requests" });
    fill("Search requests…", " export ");
    await waitFor(() =>
      expect(view.router.state.location.search).toEqual({ q: "export" }),
    );
  });

  it("creates a request with the default status", async () => {
    const api = creating();
    api.reply(createPostFixture.ok({ id: "post_dark" }));
    const view = renderPage(TeamPostsPage, meta, { search: { new: true } });
    await createFlow(view);
    await waitFor(() => expect(api.calls("createQuillsPost")).toHaveLength(1));
    await expect(
      api.calls("createQuillsPost")[0]!.clone().json(),
    ).resolves.toEqual({
      boardId: "board_ideas",
      title: "Dark mode",
      content: "For the **night** shift.",
      statusId: "status_open",
      tagIds: [],
    });
  });

  it("posts for a customer with a status and a tag", async () => {
    const api = creating();
    api.reply(listUsersFixture.ok({ items: [inboxCustomer] }));
    api.reply(createPostFixture.ok({ id: "post_dark" }));
    const view = renderPage(TeamPostsPage, meta, { search: { new: true } });
    await view.findByRole("dialog");
    fireEvent.click(view.getByRole("combobox", { name: "Author: You" }));
    fill("Find a customer", "barb");
    fireEvent.click(await view.findByRole("option", { name: "Barbara" }));
    expect(
      view.getByRole("combobox", { name: "Author: Barbara" }),
    ).toBeVisible();
    await choose("Status", "Planned");
    press("Tags");
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: "UX" }));
    await createFlow(view);
    await waitFor(() => expect(api.calls("createQuillsPost")).toHaveLength(1));
    await expect(
      api.calls("createQuillsPost")[0]!.clone().json(),
    ).resolves.toMatchObject({
      statusId: "status_planned",
      tagIds: ["tag_ux"],
      authorPrincipalId: "principal_new",
    });
  });

  it("hides New request without the create permission", async () => {
    prepare();
    const view = renderPage(TeamPostsPage, meta, {
      permissions: { create: false },
    });
    await view.findByRole("region", { name: "Requests" });
    expect(view.queryByRole("button", { name: /New request/ })).toBeNull();
    expect(view.getByRole("link", { name: /Triage/ })).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/triage",
    );
  });
});
