import { fireEvent, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { getPostFilterCountsFixture } from "../../api/team/get-post-filter-counts.fixture";
import { listPostsFixture } from "../../api/team/list-posts.fixture";
import { listStatusesFixture } from "../../api/team/list-statuses.fixture";
import { setPostStatusFixture } from "../../api/team/set-post-status.fixture";
import { press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { toast } from "../../ui/upstream";
import {
  inboxBoards,
  inboxPosts,
  inboxStatuses,
  inboxTags,
} from "../team-posts/inbox.fixture";
import { readCollapsed } from "./collapsed-columns";
import { meta } from "./meta";
import { TeamRoadmapPage } from "./team-roadmap-page";

const [exportPost, ssoPost] = inboxPosts.items;
const counts = (open: number, planned: number) =>
  getPostFilterCountsFixture.ok({
    statuses: [
      { id: "status_open", count: open },
      { id: "status_planned", count: planned },
    ],
  });
// The statuses, boards and counts load first. Then the Open, Planned and Complete columns.
const prepare = () => {
  const api = mockApi();
  api.reply(inboxStatuses);
  api.reply(inboxBoards);
  api.reply(counts(12, 4));
  api.reply(listPostsFixture.ok({ items: [exportPost!] }));
  api.reply(listPostsFixture.ok({ items: [ssoPost!] }));
  api.reply(listPostsFixture.ok());
  return api;
};
// A saved move refreshes every column, then the counts.
const refreshAfterMove = (api: ReturnType<typeof mockApi>) => {
  api.reply(listPostsFixture.ok());
  api.reply(
    listPostsFixture.ok({
      items: [{ ...exportPost!, statusId: "status_planned" }, ssoPost!],
    }),
  );
  api.reply(listPostsFixture.ok());
  api.reply(counts(11, 5));
};
const column = (view: ReturnType<typeof renderPage>, name: string) =>
  view.getByRole("region", { name });
const moveExportToPlanned = async (view: ReturnType<typeof renderPage>) => {
  await view.findByRole("link", { name: "Export to CSV" });
  press("Move Export to CSV");
  fireEvent.click(await view.findByRole("menuitemradio", { name: "Planned" }));
};

afterEach(() => window.localStorage.clear());

describe("TeamRoadmapPage", () => {
  describePageContract(meta, TeamRoadmapPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 3; index++) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        api.fail();
        api.reply(inboxBoards);
        api.reply(counts(0, 0));
      },
    },
    empty: {
      prepare: () => {
        const api = mockApi();
        api.reply(listStatusesFixture.ok());
        api.reply(inboxBoards);
        api.reply(counts(0, 0));
      },
    },
    ready: { prepare: () => void prepare() },
    done: {
      prepare: () => {
        const api = prepare();
        api.reply(setPostStatusFixture.ok({ id: "post_export" }));
        refreshAfterMove(api);
      },
      act: async (view) => {
        await moveExportToPlanned(view);
        await waitFor(() => expect(view.getByText("11")).toBeVisible());
      },
    },
  });

  it("shows one column per status in order, with the counts and the cards", async () => {
    const api = prepare();
    const view = renderPage(TeamRoadmapPage, meta);
    const card = await view.findByRole("link", { name: "Export to CSV" });
    expect(
      view.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Open", "Planned", "Complete"]);
    const open = column(view, "Open");
    expect(within(open).getByText("12")).toBeVisible();
    expect(within(column(view, "Complete")).getByText("0")).toBeVisible();
    expect(card).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/posts/post_export",
    );
    const article = card.closest("article")!;
    expect(article).toHaveTextContent(/Created \w{3} \d{4}/);
    expect(article).toHaveTextContent("Ideas");
    expect(article).toHaveTextContent("3 votes");
    expect(article).toHaveTextContent("0 comments");
    const queries = api
      .calls("listQuillsPosts")
      .map((request) => new URL(request.url).searchParams);
    expect(queries.map((query) => query.get("statusIds"))).toEqual([
      "status_open",
      "status_planned",
      "status_done",
    ]);
    expect(queries[0]!.get("sort")).toBe("votes");
    expect(queries[0]!.get("limit")).toBe("50");
    expect(view.getByRole("link", { name: "Public roadmap" })).toHaveAttribute(
      "href",
      "/portal/workspace_test_1/roadmap",
    );
    expect(
      view.getByRole("button", { name: "Move the Open column" }),
    ).toBeVisible();
  });

  it("opens New request in the status of the column", async () => {
    const api = prepare();
    api.reply(inboxTags);
    const view = renderPage(TeamRoadmapPage, meta);
    await view.findByRole("link", { name: "Export to CSV" });
    press("New request in Planned");
    expect(
      await view.findByRole("dialog", { name: "New request" }),
    ).toBeVisible();
    expect(view.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Planned",
    );
  });

  it("moves a card at once and saves the new status", async () => {
    const api = prepare();
    let save!: (body: unknown) => void;
    api.defer(({ resolve }) => {
      save = resolve;
    });
    refreshAfterMove(api);
    const view = renderPage(TeamRoadmapPage, meta);
    await moveExportToPlanned(view);
    const planned = column(view, "Planned");
    expect(
      within(planned).getByRole("link", { name: "Export to CSV" }),
    ).toBeVisible();
    expect(within(column(view, "Open")).queryByRole("link")).toBeNull();
    expect(within(planned).getByText("5")).toBeVisible();
    await waitFor(() =>
      expect(api.calls("setQuillsPostStatus")).toHaveLength(1),
    );
    const request = api.calls("setQuillsPostStatus")[0]!;
    expect(new URL(request.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/status",
    );
    await expect(request.clone().json()).resolves.toEqual({
      statusId: "status_planned",
    });
    save(setPostStatusFixture.ok({ id: "post_export" }));
    await waitFor(() =>
      expect(api.calls("getQuillsPostFilterCounts")).toHaveLength(2),
    );
    expect(
      within(column(view, "Planned")).getByRole("link", {
        name: "Export to CSV",
      }),
    ).toBeVisible();
  });

  it("puts the card back and says so when the move fails", async () => {
    const error = vi.spyOn(toast, "error");
    const api = prepare();
    api.fail();
    const view = renderPage(TeamRoadmapPage, meta);
    await moveExportToPlanned(view);
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "The request did not move. Try again.",
      ),
    );
    expect(
      within(column(view, "Open")).getByRole("link", { name: "Export to CSV" }),
    ).toBeVisible();
    expect(within(column(view, "Planned")).getAllByRole("link")).toHaveLength(
      1,
    );
    expect(within(column(view, "Open")).getByText("12")).toBeVisible();
  });

  it("remembers a collapsed column, which then loads nothing", async () => {
    const api = prepare();
    const view = renderPage(TeamRoadmapPage, meta);
    await view.findByRole("link", { name: "Single sign-on" });
    press("Options for Planned");
    fireEvent.click(await view.findByRole("menuitem", { name: "Hide column" }));
    expect(within(column(view, "Planned")).queryByRole("link")).toBeNull();
    expect(readCollapsed("workspace_test_1")).toEqual(["status_planned"]);
    view.unmount();
    api.reply(inboxStatuses);
    api.reply(inboxBoards);
    api.reply(counts(12, 4));
    api.reply(listPostsFixture.ok({ items: [exportPost!] }));
    api.reply(listPostsFixture.ok());
    const again = renderPage(TeamRoadmapPage, meta);
    expect(
      await again.findByRole("button", { name: "Show Planned" }),
    ).toBeVisible();
    await again.findByRole("link", { name: "Export to CSV" });
    expect(within(column(again, "Planned")).getByText("4")).toBeVisible();
    expect(api.calls("listQuillsPosts")).toHaveLength(5);
  });

  it("hides the controls that the permissions do not allow", async () => {
    prepare();
    const view = renderPage(TeamRoadmapPage, meta, {
      permissions: { manageSettings: false, create: false, update: false },
    });
    await view.findByRole("link", { name: "Export to CSV" });
    expect(view.queryByRole("button", { name: /column$/ })).toBeNull();
    expect(view.queryByRole("button", { name: /^New request/ })).toBeNull();
    expect(view.queryByRole("button", { name: /^Move / })).toBeNull();
  });

  it("shows only the open or the finished columns from the tabs", async () => {
    prepare();
    const view = renderPage(TeamRoadmapPage, meta);
    await view.findByRole("link", { name: "Export to CSV" });
    expect(view.getByRole("tab", { name: /^All/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(view.getByRole("tab", { name: /^Active/ }));
    expect(view.queryByRole("region", { name: "Complete" })).toBeNull();
    expect(view.getByRole("region", { name: "Planned" })).toBeVisible();
    fireEvent.click(view.getByRole("tab", { name: /^Done/ }));
    expect(view.queryByRole("region", { name: "Planned" })).toBeNull();
    expect(view.getByRole("region", { name: "Complete" })).toBeVisible();
  });
});
