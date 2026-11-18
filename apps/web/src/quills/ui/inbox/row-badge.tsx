import { Badge, cn } from "../upstream";
import type { InboxBadge } from "./inbox-types";

export interface RowBadgeProps {
  badge: InboxBadge;
}

const variants = {
  neutral: "outline",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
} as const;

/** One status badge of an inbox row, in sentence case. */
export function RowBadge({ badge }: RowBadgeProps) {
  return (
    <Badge
      variant={variants[badge.tone ?? "neutral"]}
      className={cn(
        "font-medium",
        // A neutral badge is a quiet hairline pill, like the chips of the rows.
        (badge.tone ?? "neutral") === "neutral" &&
          "rounded-full border-border text-muted-foreground",
      )}
    >
      {badge.label}
    </Badge>
  );
}
