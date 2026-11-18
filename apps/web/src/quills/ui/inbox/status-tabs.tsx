import { Tabs, TabsList, TabsTab } from "../upstream";

export interface StatusTabsProps {
  /** The accessible name of the tab list, such as "Status". */
  label: string;
  tabs: readonly StatusTab[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * The status filter of an inbox list, such as Open, Snoozed and All: the current tab is a filled
 * pill and the others are outlined pills. The arrow keys move between tabs.
 */
export function StatusTabs({ label, tabs, value, onChange }: StatusTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(String(next))}>
      <TabsList
        aria-label={label}
        className="mx-4 mb-2 max-w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 text-muted-foreground *:data-[slot=tab-indicator]:hidden"
      >
        {tabs.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            className="h-7 grow-0 rounded-full border-border px-3 transition-colors duration-150 hover:bg-accent hover:text-foreground data-active:border-transparent data-active:bg-foreground/6 sm:h-7"
          >
            {tab.label}{" "}
            {tab.count === undefined ? null : (
              <span className="tabular-nums text-faint-foreground">
                {tab.count}
              </span>
            )}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}

export interface StatusTab {
  value: string;
  label: string;
  /** Shown after the label when known. */
  count?: number;
}
