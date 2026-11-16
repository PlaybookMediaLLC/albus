import { type PointerEvent, useRef } from "react";
import { cn } from "../upstream";
import { clampListWidth, LIST_WIDTH } from "./list-width";

export interface ListResizerProps {
  /** The accessible name and the tooltip, such as "Resize the list". */
  label: string;
  /** The ID of the list pane that it resizes. */
  controls: string;
  width: number;
  onResize: (width: number) => void;
  className?: string;
}

const STEP = 16;
// In a right-to-left page the list pane sits on the right, so a move to the left widens it.
const direction = (element: Element) =>
  getComputedStyle(element).direction === "rtl" ? -1 : 1;

/**
 * The drag handle on the edge of the list pane (a window splitter): drag it, or focus it and use
 * the arrow keys, Home and End.
 */
export function ListResizer(props: ListResizerProps) {
  const drag = useRef<{ x: number; width: number; dir: number } | null>(null);
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={props.label}
      aria-controls={props.controls}
      aria-valuemin={LIST_WIDTH.min}
      aria-valuemax={LIST_WIDTH.max}
      aria-valuenow={props.width}
      title={props.label}
      tabIndex={0}
      className={cn(
        "absolute inset-y-0 -end-1 z-10 w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-transparent hover:after:bg-ring focus-visible:after:w-0.5 focus-visible:after:bg-ring",
        props.className,
      )}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          x: event.clientX,
          width: props.width,
          dir: direction(event.currentTarget),
        };
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (start)
          props.onResize(
            clampListWidth(start.width + (event.clientX - start.x) * start.dir),
          );
      }}
      // The capture ends after pointerup, a cancel or a lost window, and then fires this.
      onLostPointerCapture={() => {
        drag.current = null;
      }}
      onKeyDown={(event) => {
        const dir = direction(event.currentTarget);
        const next = {
          ArrowLeft: props.width - STEP * dir,
          ArrowRight: props.width + STEP * dir,
          Home: LIST_WIDTH.min,
          End: LIST_WIDTH.max,
        }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        props.onResize(clampListWidth(next));
      }}
    />
  );
}
