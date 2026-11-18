import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PostStatusIcon } from "../ui/inbox/post-status-icon";
import { cn } from "../ui/upstream";
import type { TeamNavItem } from "./nav";

export interface SidebarItemProps {
  item: TeamNavItem;
  /** Runs after the item is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
}

const row =
  "flex h-7.5 w-full items-center gap-2 rounded-md px-2 text-start text-sm text-sidebar-foreground outline-none transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-foreground/6 aria-[current=page]:font-medium aria-[current=page]:text-foreground [&>svg]:size-4 [&>svg]:shrink-0 [&>.lucide]:text-muted-foreground aria-[current=page]:[&>.lucide]:text-foreground";

/** One sidebar view: icon, label and a right-aligned count. The current view has a flat grey fill. */
export function SidebarItem({ item, onNavigate }: SidebarItemProps) {
  const { t } = useTranslation("quills");
  const Icon = item.icon;
  const content = (
    <>
      {item.status ? (
        <PostStatusIcon {...item.status} className="mx-px" />
      ) : Icon ? (
        <Icon aria-hidden="true" />
      ) : null}
      <span className="min-w-0 flex-1 truncate">
        {item.label ?? t(item.labelKey ?? "")}
      </span>{" "}
      {item.count === undefined ? null : (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 text-center text-xs leading-5 tabular-nums",
            item.attention && item.count > 0
              ? "bg-warning/15 font-semibold text-warning-foreground"
              : "text-faint-foreground",
          )}
        >
          {item.count}
        </span>
      )}
    </>
  );
  if (item.newTab)
    return (
      <a href={item.to} target="_blank" rel="noreferrer" className={row}>
        {content}
      </a>
    );
  return (
    <Link
      to={item.to}
      search={item.search}
      activeOptions={{ exact: item.exact ?? false, includeSearch: true }}
      onClick={onNavigate}
      className={row}
    >
      {content}
    </Link>
  );
}
