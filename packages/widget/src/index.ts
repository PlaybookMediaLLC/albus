import {
  createSDK,
  type IdentifyResult,
  type WidgetState,
} from "./core/sdk.js";
import type {
  InitOptions,
  Identity,
  OpenOptions,
  WidgetUser,
  EventName,
  EventMap,
  EventHandler,
  Unsubscribe,
} from "./types.js";

import { SDK_VERSION } from "./version.js";

export { SDK_VERSION };
export type {
  IdentifyResult,
  WidgetState,
  InitOptions,
  Identity,
  OpenOptions,
  WidgetUser,
  EventName,
  EventMap,
  EventHandler,
  Unsubscribe,
};

const sdk = createSDK();

export const Quills = {
  version: SDK_VERSION,
  init(options: InitOptions): void {
    sdk.dispatch("init", options);
  },
  /** Resolves with the result once the widget confirms or refuses this identity. */
  identify(identity?: Identity): Promise<IdentifyResult> {
    return sdk.dispatch("identify", identity) as Promise<IdentifyResult>;
  },
  logout(): void {
    sdk.dispatch("logout");
  },
  open(options?: OpenOptions): void {
    sdk.dispatch("open", options);
  },
  close(): void {
    sdk.dispatch("close");
  },
  /** Opens the panel when closed, closes it when open. */
  toggle(): void {
    sdk.dispatch("toggle");
  },
  /** Overrides the workspace theme; `error` reports an invalid value. */
  setTheme(theme: "auto" | "light" | "dark"): void {
    sdk.dispatch("setTheme", theme);
  },
  /** Changes the language without a reload. */
  setLocale(locale: string): void {
    sdk.dispatch("setLocale", locale);
  },
  showLauncher(): void {
    sdk.dispatch("showLauncher");
  },
  hideLauncher(): void {
    sdk.dispatch("hideLauncher");
  },
  // State queries — synchronous reads of internal state.
  isOpen(): boolean {
    return sdk.isOpen();
  },
  getUser(): WidgetUser | null {
    return sdk.getUser();
  },
  isIdentified(): boolean {
    return sdk.isIdentified();
  },
  /** A snapshot of the widget state; `statechange` fires when it changes. */
  getState(): WidgetState {
    return sdk.getState();
  },
  on<T extends EventName>(name: T, handler: EventHandler<T>): Unsubscribe {
    return sdk.dispatch("on", name, handler) as Unsubscribe;
  },
  off<T extends EventName>(name: T, handler?: EventHandler<T>): void {
    sdk.dispatch("off", name, handler);
  },
  metadata(patch: Record<string, string | null>): void {
    sdk.dispatch("metadata", patch);
  },
  /** Allow or stop host-page visitor analytics; `false` also removes the stored device id. */
  tracking(enabled: boolean): void {
    sdk.dispatch("tracking", enabled);
  },
  destroy(): void {
    sdk.dispatch("destroy");
  },
};

/** @deprecated Use `Quills`. The name of the SDK before the rename; it stays for existing imports. */
export const Quackback = Quills;

export default Quills;
