import {
  ArrowDownUp,
  Bookmark,
  BookmarkPlus,
  Layers,
  Loader,
  type LucideIcon,
  Tag,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  MenuCheckboxItem,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
} from "../upstream";

export interface RequestFiltersProps {
  boards: readonly FilterOption[];
  statuses: readonly FilterOption[];
  tags: readonly FilterOption[];
  /** The checked IDs of each facet. */
  checked: Record<RequestFacet, readonly string[]>;
  /** newest, oldest, votes, trending, stale or rice. */
  sort: string;
  onFacet: (key: RequestFacet, ids: string[]) => void;
  onSort: (sort: string) => void;
  /** Adds a Deleted item to the Status submenu, checked when true. Left out when undefined. */
  deleted?: boolean;
  onDeleted?: (deleted: boolean) => void;
  /** The saved views. The Views submenu is left out when there is none. */
  views?: readonly { id: string; name: string }[];
  onView?: (viewId: string) => void;
  /** Opens the Save as view dialog. The item is left out without it. */
  onSaveView?: () => void;
  onClear: () => void;
}

const sorts = [
  { value: "newest", labelKey: "team-posts.sortNewest" },
  { value: "oldest", labelKey: "team-posts.sortOldest" },
  { value: "votes", labelKey: "team-posts.sortTop" },
  { value: "trending", labelKey: "team-posts.sortTrending" },
  { value: "stale", labelKey: "team-posts.sortStale" },
  { value: "rice", labelKey: "team-posts.sortRice" },
] as const;
// The API takes at most 50 IDs in a list filter.
const MAX_IDS = 50;

/** The request filter menu: Boards, Status, Tags and Sort submenus, saved views and Clear. */
export function RequestFilters(props: RequestFiltersProps) {
  const { t } = useTranslation("quills");
  const facet = (
    key: RequestFacet,
    labelKey: string,
    Icon: LucideIcon,
    options: readonly FilterOption[],
    extra?: ReactNode,
  ) => {
    const checked = props.checked[key];
    const toggle = (id: string, on: boolean) =>
      props.onFacet(
        key,
        on ? [...checked, id] : checked.filter((i) => i !== id),
      );
    return (
      <MenuSub>
        <MenuSubTrigger>
          <Icon aria-hidden="true" />
          {t(labelKey)}
        </MenuSubTrigger>
        <MenuSubPopup>
          {options.length ? null : (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              {t("team-posts.noOptions")}
            </p>
          )}
          {options.map((option) => {
            const on = checked.includes(option.id);
            return (
              <MenuCheckboxItem
                key={option.id}
                checked={on}
                // A board or status list needs one item: the last checked one stays.
                disabled={key !== "tags" && on && checked.length === 1}
                onCheckedChange={(next) => toggle(option.id, next)}
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
              </MenuCheckboxItem>
            );
          })}
          {options.length > 1 && options.length <= MAX_IDS ? (
            <>
              <MenuSeparator />
              <MenuItem
                onClick={() =>
                  props.onFacet(
                    key,
                    options.map((o) => o.id),
                  )
                }
              >
                {t("team-posts.selectAll")}
              </MenuItem>
            </>
          ) : null}
          {extra}
        </MenuSubPopup>
      </MenuSub>
    );
  };
  return (
    <>
      {facet("board", "team-posts.boards", Layers, props.boards)}
      {facet(
        "status",
        "team-posts.status",
        Loader,
        props.statuses,
        props.deleted === undefined ? null : (
          <>
            <MenuSeparator />
            <MenuCheckboxItem
              checked={props.deleted}
              onCheckedChange={(next) => props.onDeleted?.(next)}
            >
              {t("team-posts.deleted")}
            </MenuCheckboxItem>
          </>
        ),
      )}
      {facet("tags", "team-posts.tags", Tag, props.tags)}
      <MenuSeparator />
      <MenuSub>
        <MenuSubTrigger>
          <ArrowDownUp aria-hidden="true" />
          {t("team-posts.sort")}
        </MenuSubTrigger>
        <MenuSubPopup>
          <MenuRadioGroup
            value={props.sort}
            onValueChange={(value) => props.onSort(String(value))}
          >
            {sorts.map((item) => (
              <MenuRadioItem key={item.value} value={item.value}>
                {t(item.labelKey)}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuSubPopup>
      </MenuSub>
      {props.views?.length || props.onSaveView ? <MenuSeparator /> : null}
      {props.views?.length ? (
        <MenuSub>
          <MenuSubTrigger>
            <Bookmark aria-hidden="true" />
            {t("team-posts.views")}
          </MenuSubTrigger>
          <MenuSubPopup>
            {props.views.map((view) => (
              <MenuItem key={view.id} onClick={() => props.onView?.(view.id)}>
                {view.name}
              </MenuItem>
            ))}
          </MenuSubPopup>
        </MenuSub>
      ) : null}
      {props.onSaveView ? (
        <MenuItem onClick={props.onSaveView}>
          <BookmarkPlus aria-hidden="true" />
          {t("team-posts.saveView")}
        </MenuItem>
      ) : null}
      <MenuSeparator />
      <MenuItem variant="destructive" onClick={props.onClear}>
        <X aria-hidden="true" />
        {t("team-posts.clear")}
      </MenuItem>
    </>
  );
}

/** A multi-select group of the request filter menu. */
export type RequestFacet = "board" | "status" | "tags";

export interface FilterOption {
  id: string;
  label: string;
  /** A leading mark, such as a board dot or a status icon. */
  icon?: ReactNode;
}
