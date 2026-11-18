import { describe, expect, it } from "vite-plus/test";
import { TASKS } from "./tasks.js";
import { SelectOptionsSchema, TASK_KINDS } from "./types.js";

describe("TASKS", () => {
  it("has valid defaults for every task kind", () => {
    for (const kind of TASK_KINDS)
      expect(SelectOptionsSchema.safeParse(TASKS[kind]).success).toBe(true);
  });
});
