import type { ReactNode } from "react";
import { ShowListButton } from "./show-list-button";

export interface EmptySelectionProps {
  /** The drawing, such as `<ConversationsArt />`. */
  art?: ReactNode;
  /** Such as "No conversation selected". */
  title: string;
  /** Such as "Open a thread to read and reply." */
  text?: string;
}

/**
 * The main pane while no item is open, laid out as EmptyState. It labels the pane with a heading
 * instead of a status, so it does not compete with the list's own empty state.
 */
export function EmptySelection({ art, title, text }: EmptySelectionProps) {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12">
      <ShowListButton className="absolute start-3 top-3 hidden md:inline-flex" />
      <div className="group flex w-full max-w-sm flex-col items-start gap-4 text-start">
        {art}
        <div className="grid gap-1.5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {text ? (
            <p className="text-sm text-pretty text-muted-foreground">{text}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
