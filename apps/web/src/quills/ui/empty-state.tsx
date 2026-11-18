import type { ReactNode } from "react";
import { Kbd } from "./upstream";

export interface EmptyStateProps {
  /** The drawing, such as `<RequestsArt />`. */
  art?: ReactNode;
  title: string;
  description?: string;
  /** A shortcut to teach: its keys as keycaps, then what it does. */
  hint?: { keys: readonly string[]; label: string };
  /** The primary and secondary buttons. */
  actions?: ReactNode;
}

/**
 * The empty state of a screen: a drawing, a short title and body, a hint and actions, in a narrow
 * left-aligned column in the middle of the space. Hovering it parts the drawing's layers.
 */
export function EmptyState({
  art,
  title,
  description,
  hint,
  actions,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex min-h-full items-center justify-center px-4 py-12"
    >
      <div className="group flex w-full max-w-sm flex-col items-start gap-4 text-start">
        {art}
        <div className="grid gap-1.5">
          <p className="text-base font-semibold text-foreground">{title}</p>
          {description ? (
            <p className="text-sm text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
          {hint ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              {hint.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
              <span className="ms-0.5">{hint.label}</span>
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
