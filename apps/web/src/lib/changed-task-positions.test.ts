import { expect, it } from "vite-plus/test";
import { changedTaskPositions } from "./changed-task-positions";

const tasks = (status: string, ids: string[]) =>
  ids.map((id, position) => ({ id, position, status }));

it("lists only moved tasks, with a status only when it changed", () => {
  const before = tasks("todo", ["a", "b", "c"]);
  expect(changedTaskPositions(before, tasks("todo", ["b", "a", "c"]))).toEqual([
    { id: "b", position: 0 },
    { id: "a", position: 1 },
  ]);
  expect(
    changedTaskPositions(before, [
      ...tasks("todo", ["a", "c"]),
      ...tasks("done", ["b"]),
    ]),
  ).toEqual([
    { id: "c", position: 1 },
    { id: "b", position: 0, status: "done" },
  ]);
});
