import { describe, expect, it } from "vite-plus/test";
import { tokenCeiling } from "./budget";

describe("tokenCeiling", () => {
  it("counts text bytes and a fixed bound per image", () => {
    const text = tokenCeiling([{ role: "user", content: "héllo" }], 100);
    const parts = tokenCeiling(
      [
        {
          role: "user",
          content: [
            { type: "text", text: "héllo" },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,x" },
            },
          ],
        },
      ],
      100,
    );
    expect(text).toBe(100 + 8 + 6);
    expect(parts).toBe(text + 5_000);
  });
});
