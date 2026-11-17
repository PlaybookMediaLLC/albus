import type {
  EventName,
  Identity,
  OpenOptions,
  WidgetUser,
} from "@quills/widget";

/** The SDK surface the controls drive: the npm singleton, or the script tag's `window.Quills`. */
export type WidgetApi = {
  identify(identity?: Identity): unknown;
  logout(): void;
  open(options?: OpenOptions): void;
  close(): void;
  toggle(): void;
  setTheme(theme: "auto" | "light" | "dark"): void;
  setLocale(locale: string): void;
  showLauncher(): void;
  hideLauncher(): void;
  metadata(patch: Record<string, string | null>): void;
  tracking(enabled: boolean): void;
  on(name: EventName, handler: (payload: unknown) => void): unknown;
  off(name: EventName, handler?: (payload: unknown) => void): void;
  destroy(): void;
  /** `undefined` when this embed path cannot answer. */
  isOpen(): boolean | undefined;
  getUser(): WidgetUser | null | undefined;
  isIdentified(): boolean | undefined;
  getState(): unknown;
};

export const EVENT_NAMES: EventName[] = [
  "ready",
  "open",
  "close",
  "post:created",
  "vote",
  "comment:created",
  "identify",
  "email-submitted",
  "unread",
  "statechange",
  "error",
  "announcement",
  "presence",
];

type ScriptQuills = ((...args: unknown[]) => unknown) & { q?: unknown[] };
declare global {
  interface Window {
    Quills?: ScriptQuills;
  }
}

/** The customer snippet's queue stub: calls before sdk.js loads are replayed by it. */
export function installScriptStub() {
  if (window.Quills) return;
  const stub: ScriptQuills = function (...args: unknown[]) {
    // The SDK replays IArguments-like entries.
    (stub.q ??= []).push(args);
  };
  window.Quills = stub;
}

const call = (...args: unknown[]) => window.Quills?.(...args);

/** The script tag exposes one dispatcher: commands only, no state queries. */
export const scriptApi: WidgetApi = {
  identify: (identity) => void call("identify", identity),
  logout: () => void call("logout"),
  open: (options) => void call("open", options),
  close: () => void call("close"),
  toggle: () => void call("toggle"),
  setTheme: (theme) => void call("setTheme", theme),
  setLocale: (locale) => void call("setLocale", locale),
  showLauncher: () => void call("showLauncher"),
  hideLauncher: () => void call("hideLauncher"),
  metadata: (patch) => void call("metadata", patch),
  tracking: (enabled) => void call("tracking", enabled),
  on: (name, handler) => call("on", name, handler),
  off: (name, handler) => void call("off", name, handler),
  destroy: () => void call("destroy"),
  isOpen: () => call("isOpen") as boolean | undefined,
  getUser: () => call("getUser") as WidgetUser | null | undefined,
  isIdentified: () => call("isIdentified") as boolean | undefined,
  getState: () => call("getState"),
};
