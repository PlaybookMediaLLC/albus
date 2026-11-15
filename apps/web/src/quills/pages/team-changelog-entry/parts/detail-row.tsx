import type { ReactNode } from "react";

export interface DetailRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

/** One row of a popover card: an icon and a muted label on the left, the control on the right. */
export function DetailRow({ icon, label, children }: DetailRowProps) {
  return (
    <div className="flex min-h-10 items-center gap-2 px-3 text-sm">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}
