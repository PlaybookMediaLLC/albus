import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import * as root from "./index.js";

// The package does no IO: the API passes data in and gets data back. Test files are not scanned.
const sources = readdirSync(new URL("./", import.meta.url), {
  recursive: true,
  encoding: "utf8",
}).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));

describe("@quills/ai", () => {
  it("imports only zod and its own modules", () => {
    const imports = sources.flatMap((file) =>
      [
        ...readFileSync(new URL(file, import.meta.url), "utf8").matchAll(
          /(?:from|import)\s*\(?\s*["']([^"']+)["']/g,
        ),
      ].map((match) => match[1]!),
    );
    expect(
      imports.filter((name) => name !== "zod" && !name.startsWith(".")),
    ).toEqual([]);
  });

  it("exports exactly the public surface", () => {
    expect(Object.keys(root).sort()).toEqual(
      [
        "EXAMPLES_GUIDANCE",
        "ExampleQuerySchema",
        "ExampleSchema",
        "InMemoryExampleStore",
        "LEARNING_ERROR_KINDS",
        "LearningError",
        "PAIR_SIDE_CHARS",
        "SelectOptionsSchema",
        "TASKS",
        "TASK_KINDS",
        "TaskKindSchema",
        "VisibilitySchema",
        "findExamples",
        "renderExamples",
        "selectExamples",
      ].sort(),
    );
  });
});
