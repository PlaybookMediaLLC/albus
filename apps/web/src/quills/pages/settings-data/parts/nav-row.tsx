import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../../ui/upstream";

export interface NavRowProps extends ComponentProps<"button"> {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** A settings row that opens a sheet or a dialog: icon, title, text and a chevron. */
export function NavRow({
  icon: Icon,
  title,
  text,
  className,
  ...props
}: NavRowProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex w-full items-center gap-3.5 px-4 py-3.5 text-start outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 text-muted-foreground"
      />
    </button>
  );
}
