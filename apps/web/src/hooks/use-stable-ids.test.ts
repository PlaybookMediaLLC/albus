import { renderHook } from "@testing-library/react";
import { expect, it } from "vite-plus/test";
import { useStableIds } from "./use-stable-ids";

it("keeps the array identity until the ids or their order change", () => {
  const { result, rerender } = renderHook(({ items }) => useStableIds(items), {
    initialProps: { items: [{ id: "a" }, { id: "b" }] },
  });
  const first = result.current;
  expect(first).toEqual(["a", "b"]);
  rerender({ items: [{ id: "a" }, { id: "b" }] });
  expect(result.current).toBe(first);
  rerender({ items: [{ id: "b" }, { id: "a" }] });
  expect(result.current).toEqual(["b", "a"]);
  rerender({ items: [] });
  expect(result.current).toEqual([]);
});
