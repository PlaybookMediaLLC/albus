import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { setDesktopBadge } from "./desktop-badge";

afterEach(() => {
  delete (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});

describe("setDesktopBadge", () => {
  it("does nothing in a browser", () => {
    expect(() => setDesktopBadge(3)).not.toThrow();
  });

  it("sets the count in the desktop app and clears it at zero", () => {
    const invoke = vi.fn().mockResolvedValue(undefined);
    (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {
      invoke,
    };
    setDesktopBadge(3);
    setDesktopBadge(0);
    expect(invoke.mock.calls).toEqual([
      ["plugin:window|set_badge_count", { label: "main", value: 3 }],
      ["plugin:window|set_badge_count", { label: "main", value: null }],
    ]);
  });

  it("ignores a refused call", async () => {
    const invoke = vi.fn().mockRejectedValue(new Error("not allowed"));
    (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {
      invoke,
    };
    setDesktopBadge(1);
    await Promise.resolve();
    expect(invoke).toHaveBeenCalledOnce();
  });
});
