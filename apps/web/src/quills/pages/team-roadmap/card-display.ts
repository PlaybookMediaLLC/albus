import { createContext, useState } from "react";

/** The card details that the Display menu turns on and off. */
export const CARD_FIELDS = ["board", "author", "counts", "created"] as const;
export type CardField = (typeof CARD_FIELDS)[number];
export type CardDisplay = Readonly<Record<CardField, boolean>>;

const all: CardDisplay = {
  board: true,
  author: true,
  counts: true,
  created: true,
};
const key = (workspaceId: string) => `quills.roadmap-display.${workspaceId}`;

/** The card details shown on this browser. A blocked or broken storage shows every detail. */
export function readDisplay(workspaceId: string): CardDisplay {
  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(key(workspaceId)) ?? "{}",
    );
    const value = typeof stored === "object" && stored ? stored : {};
    return Object.fromEntries(
      CARD_FIELDS.map((field) => [
        field,
        (value as Record<string, unknown>)[field] !== false,
      ]),
    ) as CardDisplay;
  } catch {
    return all;
  }
}

/** The card details of a workspace on this browser, and a toggle for one detail. */
export function useCardDisplay(workspaceId: string) {
  const [display, setDisplay] = useState(() => readDisplay(workspaceId));
  const toggle = (field: CardField, on: boolean) => {
    const next = { ...display, [field]: on };
    setDisplay(next);
    try {
      window.localStorage.setItem(key(workspaceId), JSON.stringify(next));
    } catch {
      // shortcut: a blocked storage keeps the choice for this page only.
    }
  };
  return [display, toggle] as const;
}

/** The card details for the memoized cards, without passing them through every column. */
export const CardDisplayContext = createContext<CardDisplay>(all);
