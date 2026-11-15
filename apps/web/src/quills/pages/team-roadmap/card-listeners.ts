import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { SyntheticEvent } from "react";

/**
 * The drag listeners of a card without the events that must not start a drag: a press on a
 * button inside the card (the Move to menu), and events that bubble from a popup that renders
 * outside the card, such as the open menu.
 */
export function ownListeners(listeners: DraggableSyntheticListeners) {
  if (!listeners) return undefined;
  return Object.fromEntries(
    Object.entries(listeners).map(([name, listener]) => [
      name,
      (event: SyntheticEvent) => {
        const target = event.target as Element;
        if (!event.currentTarget.contains(target) || target.closest("button"))
          return;
        listener(event);
      },
    ]),
  );
}
