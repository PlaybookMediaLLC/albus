import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LogEntry } from "./components/EventLog.tsx";
import { EVENT_NAMES, type WidgetApi } from "./widget-api.ts";

/** Logs every widget event through `on`, and lets the controls `off` and `on` them again. */
export function useEventLog(api: WidgetApi) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const next = useRef(0);
  const log = useCallback((name: string, payload: unknown) => {
    const entry = {
      id: next.current++,
      at: new Date().toLocaleTimeString(),
      name,
      payload: JSON.stringify(payload) ?? "undefined",
    };
    setEntries((current) => [entry, ...current].slice(0, 200));
  }, []);
  // One handler per event, so off(name, handler) removes exactly ours.
  const handlers = useMemo(
    () =>
      EVENT_NAMES.map((name) => ({
        name,
        handler: (payload: unknown) => log(name, payload),
      })),
    [log],
  );
  const subscribe = useCallback(() => {
    for (const { name, handler } of handlers) api.on(name, handler);
    log("host", "subscribed to all events with on()");
  }, [api, handlers, log]);
  const unsubscribe = useCallback(() => {
    for (const { name, handler } of handlers) api.off(name, handler);
    log("host", "removed all handlers with off()");
  }, [api, handlers, log]);
  useEffect(() => {
    for (const { name, handler } of handlers) api.on(name, handler);
    return () => {
      for (const { name, handler } of handlers) api.off(name, handler);
    };
  }, [api, handlers]);
  return { entries, log, subscribe, unsubscribe };
}
