import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { openDownload } from "./open-download";

const fakeTab = () =>
  ({
    opener: window,
    location: { href: "" },
    close: vi.fn(),
  }) as unknown as Window & {
    close: ReturnType<typeof vi.fn>;
  };

describe("openDownload", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens the tab before the URL loads and keeps it from this page", async () => {
    const tab = fakeTab();
    vi.spyOn(window, "open").mockReturnValue(tab);
    let resolve = (_url: string) => {};
    const done = openDownload(
      () => new Promise<string>((ready) => (resolve = ready)),
    );
    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(tab.opener).toBeNull();
    resolve("https://storage.example.test/a.pdf");
    await done;
    expect(tab.location.href).toBe("https://storage.example.test/a.pdf");
  });

  it("opens the browser with the URL in the desktop app", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    try {
      await openDownload(async () => "https://storage.example.test/a.pdf");
    } finally {
      delete (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    }
    expect(window.open).toHaveBeenCalledOnce();
    expect(window.open).toHaveBeenCalledWith(
      "https://storage.example.test/a.pdf",
      "_blank",
    );
  });

  it("closes the empty tab when the URL fails, and fails when the tab is blocked", async () => {
    const tab = fakeTab();
    vi.spyOn(window, "open").mockReturnValue(tab);
    await expect(
      openDownload(() => Promise.reject(new Error("gone"))),
    ).rejects.toThrow("gone");
    expect(tab.close).toHaveBeenCalledOnce();
    vi.spyOn(window, "open").mockReturnValue(null);
    await expect(openDownload(async () => "x")).rejects.toThrow("blocked");
  });
});
