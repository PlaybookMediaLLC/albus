import { cleanup, render } from "@testing-library/react";
import { useState } from "react";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vite-plus/test";
import type { SubtaskRow } from "@/lib/subtask-tree";
import { VirtualTaskRows } from "./virtual-task-rows";

afterEach(cleanup);

const stubs = [
  [Element.prototype, "clientHeight", 400],
  [Element.prototype, "clientWidth", 300],
  [HTMLElement.prototype, "offsetHeight", 41],
] as const;
const originals = stubs.map(([target, key]) =>
  Object.getOwnPropertyDescriptor(target, key),
);

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  for (const [target, key, value] of stubs)
    Object.defineProperty(target, key, {
      configurable: true,
      get: () => value,
    });
});

afterAll(() => {
  vi.unstubAllGlobals();
  stubs.forEach(([target, key], index) => {
    const original = originals[index];
    if (original) Object.defineProperty(target, key, original);
  });
});

const rows: SubtaskRow<{ id: string }>[] = Array.from(
  { length: 300 },
  (_, index) => ({
    task: { id: `t${index}` },
    depth: 0,
    rowId: `t${index}`,
    childCount: 0,
    isExpanded: false,
  }),
);

function List({ draggingTaskId }: { draggingTaskId: string | null }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setElement}>
      <div>
        <VirtualTaskRows
          rows={rows}
          draggingTaskId={draggingTaskId}
          scrollElement={element}
          renderRow={(row) => <div data-task-id={row.task.id} />}
        />
      </div>
    </div>
  );
}

function renderList(draggingTaskId: string | null) {
  const { container } = render(<List draggingTaskId={draggingTaskId} />);
  return [...container.querySelectorAll("[data-task-id]")].map((element) =>
    element.getAttribute("data-task-id"),
  );
}

it("mounts only a window of a long section", () => {
  const rendered = renderList(null);
  expect(rendered.length).toBeGreaterThan(0);
  expect(rendered.length).toBeLessThan(300);
});

it("keeps the dragged row mounted outside the window", () => {
  expect(renderList(null)).not.toContain("t250");
  expect(renderList("t250")).toContain("t250");
});
