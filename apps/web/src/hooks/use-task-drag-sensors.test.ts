import { renderHook } from "@testing-library/react";
import { expect, it } from "vite-plus/test";
import { useTaskDragSensors } from "./use-task-drag-sensors";

it("returns the same sensors across renders until an option changes", () => {
  const { result, rerender } = renderHook(
    ({ disabled }) =>
      useTaskDragSensors(disabled, { delay: 200, tolerance: 8 }),
    { initialProps: { disabled: false } },
  );
  const first = result.current;
  rerender({ disabled: false });
  expect(result.current).toBe(first);
  rerender({ disabled: true });
  expect(result.current).not.toBe(first);
});
