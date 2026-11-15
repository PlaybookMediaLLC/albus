import { describe, expect, it } from "vite-plus/test";
import { inboxPosts } from "../team-posts/inbox.fixture";
import {
  canDrop,
  columnCount,
  columnPosts,
  type PendingMove,
} from "./roadmap-moves";

const [exportPost, ssoPost] = inboxPosts.items;
// Export to CSV (3 votes) moves from Open to Planned, where Single sign-on has 1 vote.
const moves = new Map<string, PendingMove>([
  [exportPost!.id, { post: exportPost!, to: "status_planned" }],
]);
const statuses = new Map([
  ["status_open", { category: "active" }],
  ["status_planned", { category: "active" }],
  ["status_done", { category: "complete" }],
]);

describe("roadmap moves", () => {
  it("takes a moved card out of its old column and into the new one by votes", () => {
    expect(columnPosts([exportPost!], moves, "status_open")).toEqual([]);
    expect(
      columnPosts([ssoPost!], moves, "status_planned").map((post) => post.id),
    ).toEqual(["post_export", "post_sso"]);
    expect(columnPosts([ssoPost!], new Map(), "status_planned")).toEqual([
      ssoPost,
    ]);
  });

  it("moves one from the count of the old column to the new one", () => {
    expect(columnCount(12, moves, "status_open")).toBe(11);
    expect(columnCount(4, moves, "status_planned")).toBe(5);
    expect(columnCount(0, moves, "status_done")).toBe(0);
  });

  it("drops a card on another column and a column only inside its category", () => {
    const card = {
      type: "card" as const,
      post: exportPost!,
      statusId: "status_open",
      label: "Export to CSV",
    };
    const column = {
      type: "column" as const,
      statusId: "status_open",
      label: "Open",
    };
    expect(canDrop(card, "status_done", statuses)).toBe(true);
    expect(canDrop(card, "status_open", statuses)).toBe(false);
    expect(canDrop(column, "status_planned", statuses)).toBe(true);
    expect(canDrop(column, "status_done", statuses)).toBe(false);
    expect(canDrop(column, "status_open", statuses)).toBe(false);
  });
});
