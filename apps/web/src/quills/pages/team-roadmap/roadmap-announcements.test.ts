import type { Active, Over } from "@dnd-kit/core";
import { describe, expect, it } from "vite-plus/test";
import { roadmapAnnouncements } from "./roadmap-announcements";
import type { DragItem } from "./roadmap-moves";

const statuses = new Map([
  ["open", { name: "Open", category: "active" }],
  ["planned", { name: "Planned", category: "active" }],
  ["done", { name: "Complete", category: "complete" }],
]);
const t = (key: string, options: Record<string, unknown>) =>
  `${key.split(".")[1]}:${options.name}:${options.column ?? ""}`;
const node = (data: DragItem) =>
  ({ id: data.statusId, data: { current: data } }) as unknown as Active & Over;
const column = (statusId: string, label: string) =>
  node({ type: "column", statusId, label });

describe("roadmapAnnouncements", () => {
  it("announces a real drop, and a refused one as a cancel", () => {
    const say = roadmapAnnouncements(t, statuses);
    const open = column("open", "Open");
    expect(say.onDragStart({ active: open })).toBe("picked:Open:");
    expect(
      say.onDragOver?.({ active: open, over: column("planned", "") }),
    ).toBe("over:Open:Planned");
    expect(say.onDragOver?.({ active: open, over: column("open", "") })).toBe(
      "over:Open:Open",
    );
    // A column cannot move into another status category.
    expect(say.onDragOver?.({ active: open, over: column("done", "") })).toBe(
      "notHere:Open:Complete",
    );
    expect(say.onDragEnd({ active: open, over: column("done", "") })).toBe(
      "cancelled:Open:",
    );
    expect(say.onDragEnd({ active: open, over: column("planned", "") })).toBe(
      "dropped:Open:Planned",
    );
    expect(say.onDragEnd({ active: open, over: null })).toBe("cancelled:Open:");
  });
});
