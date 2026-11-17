import { describe, expect, it } from "vite-plus/test";
import { launcherCopy } from "../src/core/launcher-copy.js";
import { catalogs } from "../src/ui/i18n/catalogs.js";
import { LOCALES, isRtl, widgetLocale } from "../src/ui/i18n/locales.js";
import { en, type MessageKey } from "../src/ui/i18n/messages/en.js";
import { translate } from "../src/ui/i18n/translate.js";

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
const forms = (message: unknown) =>
  typeof message === "string"
    ? [message]
    : Object.values(message as Record<string, string>);

describe("widget copy", () => {
  it("fills placeholders and picks plural forms by the locale's rules", () => {
    expect(
      translate("en", "Vote for {title}", undefined, { title: "Dark mode" }),
    ).toBe("Vote for Dark mode");
    const votes = en["{count} votes"];
    expect(translate("en", votes, undefined, { count: 1 })).toBe("1 vote");
    expect(translate("en", votes, undefined, { count: 3 })).toBe("3 votes");
    const ru = catalogs.ru["{count} votes"];
    expect(translate("ru", votes, ru, { count: 1 })).toBe("1 голос");
    expect(translate("ru", votes, ru, { count: 3 })).toBe("3 голоса");
    expect(translate("ru", votes, ru, { count: 5 })).toBe("5 голосов");
    // A missing translation shows the English source.
    expect(translate("fr", "Sent", undefined)).toBe("Sent");
  });

  it("maps a browser or host language tag to a supported locale", () => {
    expect(widgetLocale("fr-CA")).toBe("fr");
    expect(widgetLocale("pt")).toBe("pt-BR");
    expect(widgetLocale("PT-br")).toBe("pt-BR");
    expect(widgetLocale("zh-Hant-TW")).toBe("zh-TW");
    expect(widgetLocale("zh")).toBe("zh-CN");
    expect(widgetLocale("xx")).toBe("en");
    expect(widgetLocale(undefined)).toBe("en");
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("fr")).toBe(false);
    // The SDK's launcher in the host page follows the same tags.
    expect(launcherCopy("fr-FR").open).toBe("Ouvrir le widget d’aide");
    expect(launcherCopy("zh-Hant-TW").close).toBe("關閉說明小工具");
    expect(launcherCopy("xx").dismiss).toBe("Dismiss");
  });

  it("translates every message into every language with the same placeholders", () => {
    const keys = Object.keys(en) as MessageKey[];
    for (const locale of LOCALES.filter((locale) => locale !== "en")) {
      const catalog = catalogs[locale];
      expect([locale, keys.filter((key) => !(key in catalog))]).toEqual([
        locale,
        [],
      ]);
      for (const key of keys)
        for (const text of forms(catalog[key]))
          // A plural form may spell out a small number instead of {count}.
          if (placeholders(text).length)
            expect([locale, key, placeholders(text)]).toEqual([
              locale,
              key,
              placeholders(forms(en[key])[forms(en[key]).length - 1]!),
            ]);
    }
  });
});
