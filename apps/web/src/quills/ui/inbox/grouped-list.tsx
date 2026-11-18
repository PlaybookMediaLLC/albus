import { type ReactNode, useId } from "react";

export interface GroupedListProps<Item> {
  /** The accessible name of the whole list. */
  label: string;
  groups: readonly ListGroup<Item>[];
  getKey: (item: Item) => string;
  renderItem: (item: Item) => ReactNode;
  /** An icon before a group's label, such as the status icon of a status group. */
  renderIcon?: (group: ListGroup<Item>) => ReactNode;
}

/** Inbox rows in groups, each under a header with its count. Empty groups are left out. */
export function GroupedList<Item>({
  label,
  groups,
  getKey,
  renderItem,
  renderIcon,
}: GroupedListProps<Item>) {
  const id = useId();
  return (
    <div aria-label={label} role="region" className="min-w-0">
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <div
            key={group.id}
            role="group"
            aria-labelledby={`${id}-${group.id}`}
          >
            {/* An opaque sticky header holds the light band, so rows never show through it. */}
            <h2
              id={`${id}-${group.id}`}
              className="sticky top-0 z-10 bg-background pt-2 pb-1"
            >
              <span className="flex items-center gap-2 rounded-md bg-foreground/3 px-3 py-1.5 text-xs font-medium text-foreground">
                {renderIcon?.(group)}
                {group.label}{" "}
                <span className="tabular-nums text-faint-foreground">
                  {group.items.length}
                </span>
              </span>
            </h2>
            <ul className="grid grid-cols-1 gap-0.5">
              {group.items.map((item) => (
                <li key={getKey(item)}>{renderItem(item)}</li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

export interface ListGroup<Item> {
  id: string;
  /** The group header, such as a priority or a status. */
  label: string;
  items: readonly Item[];
}
