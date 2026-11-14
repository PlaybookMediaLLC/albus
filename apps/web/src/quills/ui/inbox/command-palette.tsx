import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../core/types";
import { TeamStateView } from "../../team/team-state-view";
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Spinner,
} from "../upstream";

export interface CommandPaletteProps<Item> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The accessible name of the dialog, such as "Merge into". */
  label: string;
  /** A chip before the field, such as "Merge into". */
  chip?: string;
  /** Such as "Find the request to merge this into…". */
  placeholder: string;
  query: string;
  onQueryChange: (query: string) => void;
  /** The results. The caller filters them, for example with a search request. */
  items: readonly Item[];
  getKey: (item: Item) => string;
  renderItem: (item: Item) => ReactNode;
  /** Runs on a click or on Enter. The caller closes the palette. */
  onSelect: (item: Item) => void;
  /** True while a search runs or waits for its debounce. "No results" then stays hidden. */
  loading?: boolean;
  /** A failed search: an error with a retry instead of "No results". */
  problem?: PortalProblem | null;
  onRetry?: () => void;
}

/** A centered search over a blurred page. The arrow keys move through the results. */
export function CommandPalette<Item>(props: CommandPaletteProps<Item>) {
  const { t } = useTranslation("quills");
  return (
    <CommandDialog open={props.open} onOpenChange={props.onOpenChange}>
      <CommandDialogPopup aria-label={props.label}>
        {/* The caller filters the items, so the mode "none" keeps them as they are. */}
        <Command
          items={props.items}
          mode="none"
          value={props.query}
          onValueChange={(query) => props.onQueryChange(query)}
        >
          <div className="flex items-center gap-2 border-b border-border ps-3 pe-4">
            {props.chip ? (
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                {props.chip}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <CommandInput
                aria-label={props.placeholder}
                placeholder={props.placeholder}
              />
            </div>
            {props.loading ? <Spinner className="size-4" /> : null}
          </div>
          {/* CommandEmpty is a polite live region, so the alert of a failed search sits beside it. */}
          <CommandEmpty>
            {props.query.trim() && !props.loading && !props.problem
              ? t("inbox.noResults")
              : null}
          </CommandEmpty>
          {props.problem && !props.loading ? (
            <div className="p-2">
              <TeamStateView problem={props.problem} onRetry={props.onRetry}>
                {null}
              </TeamStateView>
            </div>
          ) : null}
          <CommandList>
            {(item: Item) => (
              <CommandItem
                key={props.getKey(item)}
                value={item}
                onClick={() => props.onSelect(item)}
              >
                <div className="min-w-0 flex-1">{props.renderItem(item)}</div>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
