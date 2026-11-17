import { describe, expect, it } from "vite-plus/test";
import { listStatusesFixture } from "../../api/team/list-statuses.fixture";
import {
  checkedStatuses,
  detailSearch,
  facetPatch,
  postListInput,
  postSearch,
  requestListTitle,
  viewFilters,
  viewSearch,
} from "./post-search";

const status = (id: string, category: "active" | "complete" | "closed") => ({
  id,
  name: id,
  slug: id,
  color: "gray",
  category,
  position: 0,
  showOnRoadmap: false,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00.000Z",
});
const statuses = listStatusesFixture.ok({
  statuses: [
    status("open", "active"),
    status("planned", "active"),
    status("done", "complete"),
  ],
}).statuses;

describe("postSearch", () => {
  it("keeps valid filters and drops unknown values", () => {
    expect(postSearch.parse({})).toEqual({});
    expect(
      postSearch.parse({ status: "done", sort: "votes", board: "b1", q: "x" }),
    ).toEqual({ sort: "votes", board: "b1", q: "x" });
    expect(postSearch.parse({ sort: "stale", tags: "t1,t2" })).toEqual({
      sort: "stale",
      tags: "t1,t2",
    });
    // The API takes at most 50 IDs in a list.
    const many = Array.from({ length: 51 }, (_, i) => `b${i}`).join(",");
    expect(postSearch.parse({ board: many })).toEqual({});
  });
});

describe("postListInput", () => {
  it("waits for the statuses", () => {
    const { input, none } = postListInput("ws", {}, undefined);
    expect(input.param.workspaceId).toBe("");
    expect(none).toBe(false);
  });

  it("filters the open tab by its statuses, the board and the search", () => {
    const { input } = postListInput(
      "ws",
      { board: "b1", q: "export", sort: "rice" },
      statuses,
    );
    expect(input).toEqual({
      param: { workspaceId: "ws" },
      query: {
        sort: "rice",
        limit: "50",
        statusIds: "open,planned",
        boardIds: "b1",
        search: "export",
      },
    });
  });

  it("filters several statuses and tags", () => {
    const { input } = postListInput(
      "ws",
      { statusId: "open,done", tags: "t1,t2" },
      statuses,
    );
    expect(input.query).toMatchObject({
      statusIds: "open,done",
      tagIds: "t1,t2",
    });
  });

  it("filters one status that the sidebar opens", () => {
    const { input, none } = postListInput(
      "ws",
      { status: "complete", statusId: "planned" },
      statuses,
    );
    expect(none).toBe(false);
    expect(input.query.statusIds).toBe("planned");
  });

  it("sends no status filter for All", () => {
    const { input } = postListInput("ws", { status: "all" }, statuses);
    expect(input.query).toEqual({ sort: "newest", limit: "50" });
  });

  it("lists the deleted posts of every status", () => {
    const { input, none } = postListInput(
      "ws",
      { status: "deleted" },
      statuses,
    );
    expect(none).toBe(false);
    expect(input.query).toEqual({
      sort: "newest",
      limit: "50",
      showDeleted: "true",
    });
  });

  it("asks for nothing when the tab has no status", () => {
    const { input, none } = postListInput("ws", { status: "closed" }, statuses);
    expect(none).toBe(true);
    expect(input.param.workspaceId).toBe("");
  });
});

describe("facetPatch", () => {
  it("turns checked boards, statuses and tags into address lists", () => {
    expect(facetPatch({}, "board", ["b1", "b2"], 3)).toEqual({
      board: "b1,b2",
    });
    // Every board is no board filter.
    expect(facetPatch({}, "board", ["b1", "b2", "b3"], 3)).toEqual({
      board: undefined,
    });
    expect(facetPatch({}, "tags", [], 2)).toEqual({ tags: undefined });
    expect(facetPatch({ status: "closed" }, "status", ["open"], 3)).toEqual({
      status: undefined,
      statusId: "open",
    });
    expect(facetPatch({}, "status", ["a", "b", "c"], 3)).toEqual({
      status: "all",
      statusId: undefined,
    });
  });

  it("keeps the Deleted tab", () => {
    expect(facetPatch({ status: "deleted" }, "status", ["open"], 3)).toEqual({
      status: "deleted",
      statusId: "open",
    });
  });
});

describe("checkedStatuses", () => {
  it("checks the chosen statuses, else those of the tab", () => {
    expect(checkedStatuses({ statusId: "done,open" }, statuses)).toEqual([
      "done",
      "open",
    ]);
    expect(checkedStatuses({}, statuses)).toEqual(["open", "planned"]);
    expect(checkedStatuses({ status: "all" }, statuses)).toEqual([
      "open",
      "planned",
      "done",
    ]);
  });
});

describe("saved views", () => {
  it("saves the checked statuses, lists and sort, and opens them again", () => {
    const filters = viewFilters(
      { board: "b1", tags: "t1,t2", sort: "trending" },
      statuses,
    );
    expect(filters).toEqual({
      status: ["open", "planned"],
      board: ["b1"],
      tags: ["t1", "t2"],
      sort: "trending",
    });
    expect(viewSearch(filters)).toEqual({
      status: undefined,
      statusId: "open,planned",
      board: "b1",
      tags: "t1,t2",
      sort: "trending",
    });
  });

  it("saves All without a status list, and Deleted as showDeleted", () => {
    expect(viewFilters({ status: "all" }, statuses)).toEqual({});
    expect(viewSearch({})).toMatchObject({ status: "all" });
    const deleted = viewFilters({ status: "deleted" }, statuses);
    expect(deleted).toEqual({ showDeleted: true });
    expect(viewSearch(deleted)).toMatchObject({ status: "deleted" });
  });

  it("drops a sort that the list does not have", () => {
    expect(viewSearch({ sort: "priority" }).sort).toBeUndefined();
  });
});

describe("detailSearch", () => {
  it("drops the New request flag and the Deleted filter", () => {
    expect(detailSearch({ new: true, board: "b1", status: "deleted" })).toEqual(
      { board: "b1", status: undefined },
    );
    expect(detailSearch({ status: "closed", q: "x" })).toEqual({
      status: "closed",
      q: "x",
    });
  });
});

describe("requestListTitle", () => {
  it("names the chosen status, else the tab", () => {
    const t = (key: string) => `t:${key}`;
    const list = statuses;
    expect(requestListTitle({ statusId: "planned" }, list, t)).toBe("planned");
    expect(requestListTitle({ status: "closed" }, list, t)).toBe(
      "t:team-posts.closed",
    );
    expect(requestListTitle({}, list, t)).toBe("t:team-posts.title");
    expect(requestListTitle({ statusId: "open,planned" }, list, t)).toBe(
      "t:team-posts.title",
    );
    expect(requestListTitle({ statusId: "gone", status: "all" }, list, t)).toBe(
      "t:team.nav.allRequests",
    );
  });
});
