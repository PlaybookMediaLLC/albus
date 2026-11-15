import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { copyRich, escapeHtml } from "./copy-rich";

afterEach(() => vi.unstubAllGlobals());

describe("copyRich", () => {
  it("escapes names for the HTML snippet", () => {
    expect(escapeHtml(`<b>"Ada" & 'Bo'</b>`)).toBe(
      "&lt;b&gt;&quot;Ada&quot; &amp; &#39;Bo&#39;&lt;/b&gt;",
    );
  });

  it("writes HTML and plain text when the browser can", async () => {
    const write = vi.fn(async () => undefined);
    vi.stubGlobal(
      "ClipboardItem",
      class {
        constructor(public items: Record<string, Blob>) {}
      },
    );
    vi.stubGlobal("navigator", { clipboard: { write } });
    expect(await copyRich("<p>Hi</p>", "Hi")).toBe(true);
    const [[item]] = write.mock.calls as unknown as [
      [{ items: Record<string, Blob> }],
    ][];
    expect(Object.keys(item[0]!.items)).toEqual(["text/html", "text/plain"]);
  });

  it("copies the plain text without the rich clipboard", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyRich("<p>Hi</p>", "Hi")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("Hi");
  });
});
