import { describe, expect, it } from "vite-plus/test";
import { isHelpCenterLocale, languageName } from "./locales";

describe("help-center locales", () => {
  it("names a language in the display language", () => {
    expect(languageName("pt-br", "en-US")).toBe("Brazilian Portuguese");
    expect(languageName("de", "en-US")).toBe("German");
  });
  it("gives the code back when the name is not known", () => {
    expect(languageName("not a locale!", "en-US")).toBe("not a locale!");
  });
  it("accepts only the locales of the API", () => {
    expect(isHelpCenterLocale("zh-tw")).toBe(true);
    expect(isHelpCenterLocale("it")).toBe(false);
  });
});
