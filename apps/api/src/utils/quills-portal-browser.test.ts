import { describe, expect, it } from "vite-plus/test";
import {
  isPortalBrowser,
  newPortalBrowser,
  portalBrowserCookie,
} from "./quills-portal-browser";

describe("portal sign-in browser binding", () => {
  it("accepts only the browser and workspace that the state was made for", () => {
    const { browser, state } = newPortalBrowser("ws_a");
    expect(state).toMatch(/^[0-9a-f]{64}$/);
    expect(isPortalBrowser(browser, "ws_a", state)).toBe(true);
    // Another browser: someone else's link.
    expect(
      isPortalBrowser(newPortalBrowser("ws_a").browser, "ws_a", state),
    ).toBe(false);
    // The same browser's state seen by another workspace's login page.
    expect(isPortalBrowser(browser, "ws_b", state)).toBe(false);
    expect(isPortalBrowser(null, "ws_a", state)).toBe(false);
    expect(isPortalBrowser(browser, "ws_a", undefined)).toBe(false);
    expect(isPortalBrowser(browser, "ws_a", "not-hex")).toBe(false);
  });

  it("uses a __Host- cookie on HTTPS", () => {
    expect(portalBrowserCookie(true)).toBe("__Host-quills-portal-sign-in");
    expect(portalBrowserCookie(false)).toBe("quills-portal-sign-in");
  });
});
