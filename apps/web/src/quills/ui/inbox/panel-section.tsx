import { ChevronRight } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { cn } from "../upstream";

export interface PanelSectionProps {
  title: string;
  /** Shown after the title, such as the number of items. */
  count?: number;
  /** A small control at the end of the heading, such as a refresh button. It stays outside the toggle. */
  action?: ReactNode;
  children: ReactNode;
}

/** One collapsible section of the right panel: a heading that opens and closes its body. */
export function PanelSection({
  title,
  count,
  action,
  children,
}: PanelSectionProps) {
  const id = useId();
  const [open, setOpen] = useState(true);
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="border-t border-border pt-3"
    >
      <div className="flex min-h-7 items-center gap-1">
        <h2 id={`${id}-heading`} className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-body`}
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center gap-1.5 rounded-md py-0.5 text-start text-xs font-medium text-foreground outline-none hover:text-foreground/80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground motion-safe:transition-transform",
                open && "rotate-90",
              )}
            />
            <span className="truncate">{title}</span>
            {/* The space keeps the accessible name "Links 2", not "Links2". */}
            {count ? (
              <>
                {" "}
                <span className="text-muted-foreground tabular-nums">
                  {count}
                </span>
              </>
            ) : null}
          </button>
        </h2>
        {action}
      </div>
      <div id={`${id}-body`} hidden={!open} className="pt-1">
        {children}
      </div>
    </section>
  );
}
