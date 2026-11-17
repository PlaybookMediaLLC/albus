import { describe, expect, it } from "vite-plus/test";
import { portalSignInHref } from "./portal-sign-in-href";

describe("portalSignInHref", () => {
  const go = (signIn?: Parameters<typeof portalSignInHref>[2]) =>
    portalSignInHref(
      "acme",
      "/portal/acme/boards/b1?sort=top",
      signIn,
      "https://api.example.test/api",
      "https://app.example.test",
    );

  it("uses the Kaneo sign-in page by default", () => {
    expect(go()).toBe(
      "/auth/sign-in?redirect=%2Fportal%2Facme%2Fboards%2Fb1%3Fsort%3Dtop",
    );
    expect(go({ mode: "account", ssoUrl: null })).toBe(go());
  });

  it("starts SSO sign-in at the account sign-in, which marks this browser first", () => {
    const url = new URL(
      go({ mode: "sso", ssoUrl: "https://host.example.test/login?app=1" })!,
    );
    expect(url.origin + url.pathname).toBe(
      "https://api.example.test/api/auth/quills/portal-sign-in",
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      via: "sso",
      workspace: "acme",
      next: "/boards/b1?sort=top",
    });
  });

  it("offers no sign-in when customer sign-in is off", () => {
    expect(go({ mode: "disabled", ssoUrl: null })).toBeNull();
  });
});
