import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "saving" | "failed";

/**
 * Saves `value` `delay` ms after its last change. `save` returns false when there is
 * nothing to save yet. One save runs at a time: a change during a save runs one more save
 * after it, so a new entry is created only once.
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
  const run = useCallback(async () => {
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    try {
      do {
        again.current = false;
        const { value: next, save: write } = latest.current;
        const snapshot = JSON.stringify(next);
        if (snapshot === saved.current) continue;
        setState("saving");
        try {
          if (await write(next)) saved.current = snapshot;
          setState("saved");
        } catch {
          setState("failed");
        }
      } while (again.current);
    } finally {
      busy.current = false;
    }
  }, []);
  const key = JSON.stringify(value);
  useEffect(() => {
    if (key === saved.current) return;
    const timer = window.setTimeout(() => void run(), delay);
    return () => window.clearTimeout(timer);
  }, [key, delay, run]);
  return { state, retry: run };
}
