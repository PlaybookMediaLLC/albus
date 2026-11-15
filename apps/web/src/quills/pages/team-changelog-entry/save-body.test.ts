import { describe, expect, it } from "vite-plus/test";
import { missingField, saveBody } from "./save-body";

describe("saveBody", () => {
  it("waits for a title, and for content on a new entry", () => {
    expect(saveBody("  ", "Text", false)).toBeNull();
    expect(saveBody("Title", " ", true)).toBeNull();
    expect(saveBody(" Title ", "Text", true)).toEqual({
      title: "Title",
      content: "Text",
    });
  });

  it("leaves empty content out of an update and keeps the limits", () => {
    expect(saveBody("Title", "", false)).toEqual({ title: "Title" });
    expect(saveBody("x".repeat(250), "Text", false)?.title).toHaveLength(200);
  });

  it("names the field that a save still needs", () => {
    expect(missingField(" ", "Text", false)).toBe("title");
    expect(missingField("Title", " ", true)).toBe("content");
    expect(missingField("Title", "", false)).toBeNull();
  });
});
