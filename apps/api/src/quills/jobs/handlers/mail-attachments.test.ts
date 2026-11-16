import { describe, expect, it, vi } from "vite-plus/test";
import { loadMailAttachments } from "./mail-attachments";

const file = (name: string, size: number) => ({
  storageKey: `key/${name}`,
  name,
  contentType: "application/pdf",
  size,
});

describe("loadMailAttachments", () => {
  it("carries the files that fit the budget and skips the rest", async () => {
    const read = vi.fn(async (key: string) =>
      Buffer.from(key.endsWith("a.pdf") ? "aaaa" : "cc"),
    );
    const attachments = await loadMailAttachments(
      [file("a.pdf", 4), file("big.pdf", 50), file("c.pdf", 2)],
      8,
      read,
    );
    expect(attachments.map((a) => a.filename)).toEqual(["a.pdf", "c.pdf"]);
    expect(read).not.toHaveBeenCalledWith("key/big.pdf", expect.anything());
    expect(new TextDecoder().decode(attachments[0]!.content)).toBe("aaaa");
  });

  it("skips a file gone from storage but retries on another failure", async () => {
    const gone = Object.assign(new Error("gone"), { name: "NoSuchKey" });
    await expect(
      loadMailAttachments([file("a.pdf", 1)], 8, async () => {
        throw gone;
      }),
    ).resolves.toEqual([]);
    await expect(
      loadMailAttachments([file("a.pdf", 1)], 8, async () => {
        throw new Error("timeout");
      }),
    ).rejects.toThrow("timeout");
  });
});
