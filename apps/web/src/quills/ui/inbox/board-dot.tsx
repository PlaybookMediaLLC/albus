import { boardTone } from "../../core/board-color";
import { cn } from "../upstream";

export interface BoardDotProps {
  /** The board whose tone the dot shows. Without one, the dot uses the text color. */
  boardId?: string;
  className?: string;
}

/** The small colored dot of a board chip, in a stable theme tone per board. */
export function BoardDot({ boardId, className }: BoardDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        boardId ? boardTone(boardId) : "bg-current",
        className,
      )}
    />
  );
}
