import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { openDownload } from "./open-download";

describe("openDownload", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens a new tab without access to this page", () => {
    const tab = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(tab);
    openDownload("https://storage.example.test/a.pdf");
    expect(open).toHaveBeenCalledWith(
      "https://storage.example.test/a.pdf",
      "_blank",
    );
    expect(tab.opener).toBeNull();
  });
});
