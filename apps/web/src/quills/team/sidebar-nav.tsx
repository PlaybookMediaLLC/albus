import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import type { TeamNavSection } from "./nav";
import { SidebarItem } from "./sidebar-item";

export interface SidebarNavProps {
  /** The name of the nav landmark. */
  label: string;
  sections: readonly TeamNavSection[];
  /** Runs after an item is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
  /** Shown after the sections, such as a line that says that nothing matches. */
  children?: ReactNode;
}

/** The sections of a sidebar. Each list takes its name from its small uppercase label. */
export function SidebarNav({
  label,
  sections,
  onNavigate,
  children,
}: SidebarNavProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  return (
    <nav
      aria-label={label}
      className="-mx-1 grid min-h-0 flex-1 content-start gap-5 overflow-y-auto px-1"
    >
      {sections.map((section) => (
        <div key={section.id} className="grid gap-1">
          <p
            id={`${id}-${section.id}`}
            className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t(section.labelKey)}
          </p>
          <ul
            aria-labelledby={`${id}-${section.id}`}
            className="grid grid-cols-1 gap-0.5"
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
