import { describe, expect, it } from "vite-plus/test";
import { renderQuillsHook } from "../../test/render";
import { keepOpen, useKeptOpen } from "./keep-open";

const rows = (...ids: string[]) => ids.map((id) => ({ id }));
const ids = (list: readonly { id: string }[]) => list.map((row) => row.id);

describe("keepOpen", () => {
  it("keeps the open item after its nearest earlier neighbor that is still listed", () => {
    const before = rows("a", "b", "c", "d");
    expect(ids(keepOpen(rows("a", "b", "d"), before, "c"))).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(ids(keepOpen(rows("a", "d"), before, "c"))).toEqual(["a", "c", "d"]);
    expect(ids(keepOpen(rows("b", "c"), before, "a"))).toEqual(["a", "b", "c"]);
  });

  it("keeps the open item as it is now when its fresh copy is given", () => {
    const before = [
      { id: "a", unread: true },
      { id: "b", unread: true },
    ];
    expect(
      keepOpen([{ id: "b", unread: true }], before, "a", {
        id: "a",
        unread: false,
      }),
    ).toEqual([
      { id: "a", unread: false },
      { id: "b", unread: true },
    ]);
  });

  it("changes nothing while the open item is listed or was never listed", () => {
    const now = rows("a", "b");
    expect(keepOpen(now, rows("a", "b"), "a")).toBe(now);
    expect(keepOpen(now, rows("a", "b"), "z")).toBe(now);
    expect(keepOpen(now, rows("a", "b"), "")).toBe(now);
  });
});

describe("useKeptOpen", () => {
  it("keeps the open row through a refresh until another row opens", () => {
    const page = (...list: string[]) => [{ items: rows(...list) }];
    const view = renderQuillsHook(
      ({ pages, open }) => useKeptOpen(pages, open, undefined, "all"),
      {
        initialProps: { pages: page("a", "b", "c"), open: "b" },
      },
    );
    view.rerender({ pages: page("a", "c"), open: "b" });
    expect(ids(view.result.current)).toEqual(["a", "b", "c"]);
    // A second refresh (a realtime refetch) keeps it too.
    view.rerender({ pages: page("a", "c"), open: "b" });
    expect(ids(view.result.current)).toEqual(["a", "b", "c"]);
    view.rerender({ pages: page("a", "c"), open: "c" });
    expect(ids(view.result.current)).toEqual(["a", "c"]);
  });
});
