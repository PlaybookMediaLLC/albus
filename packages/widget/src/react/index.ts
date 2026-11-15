import { useQuillsEvent } from "./use-event.js";
import { useQuillsInit, type UseQuillsInitOptions } from "./use-init.js";
import { useQuills } from "./use-quills.js";

export { useQuillsInit, useQuills, useQuillsEvent };
export type { UseQuillsInitOptions };

// The names before the rename to Quills. They stay for existing imports.
/** @deprecated Use `useQuillsInit`. */
export const useQuackbackInit = useQuillsInit;
/** @deprecated Use `UseQuillsInitOptions`. */
export type UseQuackbackInitOptions = UseQuillsInitOptions;
/** @deprecated Use `useQuills`. */
export const useQuackback = useQuills;
/** @deprecated Use `useQuillsEvent`. */
export const useQuackbackEvent = useQuillsEvent;

// Re-export the singleton + types so users can import everything from one subpath.
export { default as Quills, Quackback } from "../index.js";
export type {
  InitOptions,
  Identity,
  OpenOptions,
  WidgetUser,
  EventName,
  EventMap,
  EventHandler,
  Unsubscribe,
} from "../types.js";
