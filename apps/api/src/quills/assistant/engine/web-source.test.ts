import { describe, expect, it } from "vite-plus/test";
import { linksOf, pageText } from "./web-source";

describe("linksOf", () => {
  it("keeps links in the page's own folder, once each, without fragment, query or assets", () => {
    const body = `
      <a href="/docs/setup">Setup</a> <a href='setup#step-2'>Again</a>
      <a href="billing?tab=1">Billing</a> <a href="/blog/post">Blog</a>
      <a href="https://other.example/docs/x">Other site</a>
      <link href="/docs/site.css"> <a href="/docs/guide.pdf">PDF</a>
      <a href="/docs/">Self</a> <a href="javascript:alert(1)">Bad</a>`;
    expect(linksOf(body, "https://help.example/docs/")).toEqual([
      "https://help.example/docs/setup",
      "https://help.example/docs/billing",
    ]);
  });

  it("stops at 20 links", () => {
    const body = Array.from(
      { length: 30 },
      (_, i) => `<a href="/docs/page-${i}">${i}</a>`,
    ).join("");
    const links = linksOf(body, "https://help.example/docs/");
    expect(links).toHaveLength(20);
    expect(links[19]).toBe("https://help.example/docs/page-19");
  });

  it("skips a link with a user name or password", () => {
    expect(
      linksOf(
        '<a href="https://u:p@help.example/docs/x">x</a>',
        "https://help.example/docs/",
      ),
    ).toEqual([]);
  });

  it("drops NUL characters, which PostgreSQL text cannot store", () => {
    expect(pageText("<p>Ship\u0000ping</p>", true).text).toBe("Shipping");
    expect(pageText("plain\u0000 text", false).text).toBe("plain text");
  });
});
