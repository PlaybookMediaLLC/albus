import { useCallback, useEffect, useRef, useState } from "react";

/** "unsaved": the last save had nothing to save yet, so the value is not stored. */
export type SaveState = "saved" | "saving" | "unsaved" | "failed";

/**
 * Saves `value` `delay` ms after its last change. `save` returns false when there is
 * nothing to save yet. One save runs at a time: a change during a save runs one more save
 * after it, so a new entry is created only once. A change that is not saved is sent at
 * once when the editor closes, and the browser warns before the tab closes.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<boolean>,
  delay = 1000,
) {
  const [state, setState] = useState<SaveState>("saved");
  const latest = useRef({ value, save });
  latest.current = { value, save };
  const saved = useRef(JSON.stringify(value));
  const busy = useRef(false);
  const again = useRef(false);
  const pending = useRef(Promise.resolve());
  const timer = useRef<number | undefined>(undefined);
  const run = useCallback(() => {
    if (busy.current) {
      again.current = true;
      return pending.current;
    }
    busy.current = true;
    pending.current = (async () => {
      try {
        do {
          again.current = false;
          const { value: next, save: write } = latest.current;
          const snapshot = JSON.stringify(next);
          if (snapshot === saved.current) continue;
          setState("saving");
          try {
            if (await write(next)) {
              saved.current = snapshot;
              setState("saved");
            } else setState("unsaved");
          } catch {
            setState("failed");
          }
        } while (again.current);
      } finally {
        busy.current = false;
      }
    })();
    return pending.current;
  }, []);
  /** Saves now instead of after the delay. True when the current value is stored. */
  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    await run();
    return JSON.stringify(latest.current.value) === saved.current;
  }, [run]);
  const key = JSON.stringify(value);
  useEffect(() => {
    if (key === saved.current) return;
    timer.current = window.setTimeout(() => void run(), delay);
    return () => window.clearTimeout(timer.current);
  }, [key, delay, run]);
  useEffect(() => {
    const dirty = () => JSON.stringify(latest.current.value) !== saved.current;
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty()) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (dirty()) void run();
    };
  }, [run]);
  return { state, retry: run, flush };
}
