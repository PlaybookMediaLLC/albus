import { ChevronRight, ListFilter, Star } from "lucide-react";
import { type ReactNode, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { TeamHeaderContext } from "../../team/header-context";
import { cn, Menu, MenuPopup, MenuTrigger } from "../upstream";
import { IconButton } from "./icon-button";
import { useKeyShortcuts } from "./use-key-shortcuts";

export interface ListHeaderProps {
  title: string;
  /** 2 when the page already has an h1, such as a list pane beside an open item. */
  headingLevel?: 1 | 2;
  /** The filter menu items (MenuCheckboxItem, MenuItem, MenuSeparator). The button and F open it. */
  filters?: ReactNode;
  /** A filter button that runs a handler instead of a menu. Ignored with `filters`. */
  onFilters?: () => void;
  /** Controls after the filter button: a search field, pill buttons, the black create button. */
  actions?: ReactNode;
}

/** The title row of a page or list pane: the heading on the left, filters and actions on the right. */
export function ListHeader({
  title,
  headingLevel = 1,
  filters,
  onFilters,
  actions,
}: ListHeaderProps) {
  const { t } = useTranslation("quills");
  const [open, setOpen] = useState(false);
  const openFilters = filters ? () => setOpen(true) : onFilters;
  useKeyShortcuts({ f: openFilters });
  const Heading = headingLevel === 1 ? "h1" : "h2";
  // A page title in the team shell gets the section breadcrumb and the star.
  const shell = useContext(TeamHeaderContext);
  const header = headingLevel === 1 ? shell : null;
  // A bordered square, as the toolbar buttons of the list views.
  const button = {
    variant: "outline",
    label: t("inbox.filters"),
    "aria-keyshortcuts": "F",
  } as const;
  const icon = <ListFilter aria-hidden="true" />;
  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {header && header.section !== title ? (
          <>
            <span className="shrink-0 text-sm text-muted-foreground">
              {header.section}
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-faint-foreground"
            />
          </>
        ) : null}
        <Heading
          tabIndex={-1}
          className="min-w-0 truncate text-sm font-medium outline-none"
        >
          {title}
        </Heading>
        {header ? (
          <IconButton
            label={t(header.favorite ? "team.unfavorite" : "team.favorite")}
            aria-pressed={header.favorite}
            className="size-6 text-faint-foreground hover:text-foreground sm:size-6"
            onClick={() => header.onFavorite(title)}
          >
            <Star
              aria-hidden="true"
              className={cn(
                "size-3.5!",
                header.favorite && "fill-current text-warning",
              )}
            />
          </IconButton>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {filters ? (
          <Menu open={open} onOpenChange={setOpen}>
            <MenuTrigger render={<IconButton {...button} />}>
              {icon}
            </MenuTrigger>
            <MenuPopup align="end">{filters}</MenuPopup>
          </Menu>
        ) : onFilters ? (
          <IconButton {...button} onClick={onFilters}>
            {icon}
          </IconButton>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
