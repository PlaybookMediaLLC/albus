import { beforeAll, describe, expect, it, vi } from "vite-plus/test";
import {
  mintGrant,
  readGrant,
  readPortalSignIn,
  safePortalPath,
} from "./portal-sign-in";

describe("portal token sign-in grants", () => {
  beforeAll(() => {
    vi.stubEnv("AUTH_SECRET", "unit-auth-secret-of-at-least-32-characters");
  });
  const claims = { workspaceId: "w1", customerId: "c1", next: "/boards" };

  it("reads a grant only for its own purpose, unchanged and before it expires", () => {
    const handoff = mintGrant("handoff", claims);
    expect(readGrant("handoff", handoff)).toMatchObject(claims);
    expect(readGrant("session", handoff)).toBeNull();
    const [payload, signature] = handoff.split(".");
    const forged = Buffer.from(
      Buffer.from(payload!, "base64url").toString().replace("c1", "c2"),
    ).toString("base64url");
    expect(readGrant("handoff", `${forged}.${signature}`)).toBeNull();
    expect(readGrant("handoff", mintGrant("handoff", claims, -1))).toBeNull();
    const session = mintGrant("session", {
      ...claims,
      email: "ada@example.test",
      name: "Ada",
    });
    expect(readGrant("session", session)).toMatchObject({
      email: "ada@example.test",
    });
  });

  it("lands only on a portal path, never another origin", () => {
    expect(safePortalPath("/boards/b1?sort=top")).toBe("/boards/b1?sort=top");
    for (const next of [
      "//evil.test",
      "/\\evil.test",
      "https://evil.test",
      "boards",
      undefined,
    ])
      expect(safePortalPath(next)).toBe("");
  });

  it("reads the stored policy, and SSO without a URL is the Kaneo sign-in", () => {
    expect(readPortalSignIn(null)).toEqual({
      mode: "kaneo",
      widgetSignIn: false,
      ssoUrl: null,
    });
    expect(
      readPortalSignIn(
        JSON.stringify({ signIn: { mode: "sso", widgetSignIn: true } }),
      ),
    ).toEqual({ mode: "kaneo", widgetSignIn: true, ssoUrl: null });
    expect(
      readPortalSignIn(
        JSON.stringify({
          signIn: { mode: "sso", ssoUrl: "https://app.example.test/login" },
        }),
      ).mode,
    ).toBe("sso");
    expect(readPortalSignIn("not json").mode).toBe("kaneo");
  });
});
