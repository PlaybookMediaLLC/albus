import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
} from "@tanstack/react-virtual";
import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { focusTaskElement } from "@/components/project/task-view-keys/focus-task-element";
import type { SubtaskRow } from "@/lib/subtask-tree";
import useBulkSelectionStore from "@/store/bulk-selection";

const ROW_ESTIMATE = 41;

type VirtualTaskRowsProps<T extends { id: string }> = {
  rows: SubtaskRow<T>[];
  draggingTaskId: string | null;
  scrollElement: HTMLElement | null;
  renderRow: (row: SubtaskRow<T>) => ReactNode;
};

/** Mounts only the rows near the viewport of a long list section. */
export function VirtualTaskRows<T extends { id: string }>({
  rows,
  draggingTaskId,
  scrollElement,
  renderRow,
}: VirtualTaskRowsProps<T>) {
  "use no memo";
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  // Sections stack in one scroller, so rows start below everything above them.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    if (!container || !scrollElement) return;
    const measure = () =>
      setScrollMargin(
        container.getBoundingClientRect().top -
          scrollElement.getBoundingClientRect().top +
          scrollElement.scrollTop,
      );
    measure();
    // Sections above expand and collapse without rendering this one.
    const observer = new ResizeObserver(measure);
    if (scrollElement.firstElementChild)
      observer.observe(scrollElement.firstElementChild);
    return () => observer.disconnect();
  }, [container, scrollElement]);

  const draggingIndex = draggingTaskId
    ? rows.findIndex((row) => row.task.id === draggingTaskId)
    : -1;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 8,
    scrollMargin,
    getItemKey: (index) => rows[index].rowId,
    rangeExtractor: (range: Range) => {
      const indexes = defaultRangeExtractor(range);
      return draggingIndex < 0 || indexes.includes(draggingIndex)
        ? indexes
        : [...indexes, draggingIndex].sort((a, b) => a - b);
    },
  });

  const focusedTaskId = useBulkSelectionStore((state) => state.focusedTaskId);
  const focusedIndex = focusedTaskId
    ? rows.findIndex((row) => row.task.id === focusedTaskId)
    : -1;

  useEffect(() => {
    if (!focusedTaskId || focusedIndex < 0) return;
    if (document.querySelector(`[data-task-id="${focusedTaskId}"]`)) return;
    virtualizer.scrollToIndex(focusedIndex, { align: "auto" });
    const frame = requestAnimationFrame(() =>
      focusTaskElement(focusedTaskId, true),
    );
    return () => cancelAnimationFrame(frame);
  }, [focusedTaskId, focusedIndex, virtualizer]);

  return (
    <div
      ref={setContainer}
      className="relative"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => (
        <div
          key={item.key}
          ref={virtualizer.measureElement}
          data-index={item.index}
          className="absolute inset-x-0 top-0"
          style={{
            transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {renderRow(rows[item.index])}
        </div>
      ))}
    </div>
  );
}
