import { describe, expect, it } from "vite-plus/test";
import { widgetCopy } from "../src/core/copy";

describe("widgetCopy", () => {
  it("picks the exact locale, then its language, then English", () => {
    expect(widgetCopy("forYou", "pt-BR")).toBe("Para você");
    expect(widgetCopy("forYou", "es-MX")).toBe("Para ti");
    expect(widgetCopy("forYou", "sw")).toBe("For you");
  });

  it("reads traditional Chinese in Taiwan and Hong Kong, simplified elsewhere", () => {
    expect(widgetCopy("forYou", "zh-TW")).toBe("為您");
    expect(widgetCopy("forYou", "zh_HK")).toBe("為您");
    expect(widgetCopy("forYou", "zh-CN")).toBe("为您");
  });

  it("fills in the title", () => {
    expect(widgetCopy("newEntry", "de", "Dark mode")).toBe("Neu: Dark mode");
  });
});
