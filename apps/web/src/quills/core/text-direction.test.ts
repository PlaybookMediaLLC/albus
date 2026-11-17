import { describe, expect, it } from "vite-plus/test";
import { directionOf } from "./text-direction";

describe("directionOf", () => {
  it("knows right-to-left languages and scripts", () => {
    for (const tag of [
      "ar",
      "ar-EG",
      "AR",
      "he-IL",
      "fa",
      "ur-PK",
      "ku-Arab",
      "pa_Arab",
    ])
      expect(directionOf(tag), tag).toBe("rtl");
  });

  it("leaves left-to-right languages alone", () => {
    for (const tag of [
      "en",
      "en-US",
      "de",
      "fr-CA",
      "zh-TW",
      "ja",
      "ku",
      "arn",
    ])
      expect(directionOf(tag), tag).toBe("ltr");
  });
});
