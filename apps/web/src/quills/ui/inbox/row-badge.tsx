import { Badge } from "../upstream";
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
    <Badge variant={variants[badge.tone ?? "neutral"]} className="font-medium">
      {badge.label}
    </Badge>
  );
}
