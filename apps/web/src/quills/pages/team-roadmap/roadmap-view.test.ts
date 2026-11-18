import { describe, expect, it } from "vite-plus/test";
import { inView } from "./roadmap-view";

describe("inView", () => {
  it("shows open statuses in Active, finished ones in Done and every one in All", () => {
    expect(inView("active", "active")).toBe(true);
    expect(inView("active", "complete")).toBe(false);
    expect(inView("done", "complete")).toBe(true);
    expect(inView("done", "closed")).toBe(true);
    expect(inView("done", "active")).toBe(false);
    expect(inView("all", "closed")).toBe(true);
  });
});
