import { describe, expect, it } from "vite-plus/test";
import { avatarFile } from "./avatar-file";

describe("avatarFile", () => {
  it("turns prepared base64 data into a typed file", async () => {
    const file = avatarFile({ contentType: "image/webp", data: btoa("abc") });
    expect(file.name).toBe("avatar.webp");
    expect(file.type).toBe("image/webp");
    expect(file.size).toBe(3);
    expect(await file.text()).toBe("abc");
    expect(avatarFile({ contentType: "image/png", data: "" }).name).toBe(
      "avatar.png",
    );
  });
});
