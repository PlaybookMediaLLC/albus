import { useEffect } from "react";
import Quills from "../index.js";
import type { EventName, EventHandler } from "../types.js";

/**
 * Subscribe to a widget event for the component's lifetime. The handler
 * fires synchronously when the event is emitted.
 */
export function useQuillsEvent<T extends EventName>(
  name: T,
  handler: EventHandler<T>,
): void {
  useEffect(() => {
    const unsub = Quills.on(name, handler);
    return unsub;
  }, [name, handler]);
}
