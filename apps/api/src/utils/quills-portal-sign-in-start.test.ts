import { describe, expect, it } from "vite-plus/test";
import { startPage } from "./quills-portal-sign-in-start";

describe("portal sign-in start page", () => {
  it("puts the values in escaped meta tags and runs only its fixed script", () => {
    const page = startPage({
      state: "d".repeat(64),
      workspace: "ws_a",
      via: "widget",
      next: '/boards?x="><script>',
    });
    expect(page).toContain(
      `<meta name="quills-state" content="${"d".repeat(64)}">`,
    );
    expect(page).toContain('<meta name="quills-via" content="widget">');
    expect(page).toContain("&quot;&gt;&lt;script&gt;");
    expect(page.match(/<script>/g)).toHaveLength(1);
    // The widget handshake answers only its opener on this origin.
    expect(page).toContain(
      "event.source !== opener || event.origin !== location.origin",
    );
  });
});
