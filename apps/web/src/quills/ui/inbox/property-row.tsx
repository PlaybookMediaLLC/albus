import type { ReactNode } from "react";

export interface PropertyRowProps {
  label: string;
  /** The value or the control that changes it, such as a select. */
  children: ReactNode;
}

/**
 * One labelled property of the properties panel, such as Status or Assignee. A one-line value
 * centers on the label; a taller one, such as a list, starts at the label's line.
 */
export function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-2 text-sm">
      <dt className="truncate leading-8 text-muted-foreground">{label}</dt>
      <dd className="flex min-h-8 min-w-0 flex-col items-start justify-center">
        {children}
      </dd>
    </dl>
  );
}
