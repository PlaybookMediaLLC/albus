import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import type { TeamNavSection } from "./nav";
import { cn } from "../ui/upstream";
import { SidebarItem } from "./sidebar-item";

export interface SidebarNavProps {
  /** The name of the nav landmark. */
  label: string;
  sections: readonly TeamNavSection[];
  /** Runs after an item is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
  /** Shown after the sections, such as a line that says that nothing matches. */
  children?: ReactNode;
  /** Keeps the section labels for screen readers only, when a heading above names the list. */
  hideLabels?: boolean;
  className?: string;
}

/** The sections of a sidebar. Each list takes its name from its small label. */
export function SidebarNav({
  label,
  sections,
  onNavigate,
  children,
  hideLabels = false,
  className,
}: SidebarNavProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  return (
    <nav
      aria-label={label}
      className={cn(
        "-mx-1 grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-1",
        className,
      )}
    >
      {sections.map((section) => (
        <div key={section.id} className="grid gap-0.5">
          <p
            id={`${id}-${section.id}`}
            className={
              hideLabels
                ? "sr-only"
                : "px-2 pb-0.5 text-xs font-medium text-muted-foreground"
            }
          >
            {t(section.labelKey)}
          </p>
          <ul
            aria-labelledby={`${id}-${section.id}`}
            className="grid grid-cols-1 gap-px"
          >
            {section.items.map((item) => (
              <li key={item.id}>
                <SidebarItem item={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {children}
    </nav>
  );
}
