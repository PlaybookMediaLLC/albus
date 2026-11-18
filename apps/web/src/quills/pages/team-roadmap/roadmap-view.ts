/** The roadmap's status tabs: the open statuses, the finished ones (complete or closed), or all. */
export type RoadmapView = "active" | "done" | "all";

export const ROADMAP_VIEWS = ["active", "done", "all"] as const;

/** Whether a status of this category shows in the view. */
export const inView = (view: RoadmapView, category: string) =>
  view === "all" || (category === "active") === (view === "active");
