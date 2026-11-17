import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { readerLocale, readsEnglish } from "./reader-locale";

describe("readerLocale", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prefers the saved language, then the browser's", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");
    expect(readerLocale("ar")).toBe("ar");
    expect(readerLocale(null)).toBe("fr-FR");
    expect(readerLocale("  ")).toBe("fr-FR");
  });

  it("knows English readers", () => {
    expect(readsEnglish("en")).toBe(true);
    expect(readsEnglish("en-GB")).toBe(true);
    expect(readsEnglish("eo")).toBe(false);
    expect(readsEnglish("ar")).toBe(false);
  });
});
