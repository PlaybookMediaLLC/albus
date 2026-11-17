import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import db, { schema } from "../../apps/api/src/database";
import { endProviderSessions } from "../../apps/api/src/backchannel-logout/controllers/end-provider-sessions";
import { createApp } from "../../apps/api/src/index";
import { resetTestDatabase } from "./helpers/database";
import { createWorkspaceMember } from "./helpers/fixtures";

// The desktop app's sign-in (apps/api/src/desktop) against real Better Auth: a device-flow
// token becomes the session cookie, and nothing else can mint one.
const origin = "http://localhost:5173";
type App = ReturnType<typeof createApp>["app"];

const json = { "content-type": "application/json", Origin: origin };

function cookiesOf(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

async function signedInCookie(app: App) {
  const email = `desktop-${randomUUID()}@example.com`;
  const password = "desktop-session-password-12345";
  const signUp = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ name: "Desktop user", email, password }),
  });
  expect(signUp.status).toBe(200);
  const signIn = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ email, password }),
  });
  expect(signIn.status).toBe(200);
  return { email, cookie: cookiesOf(signIn) };
}

/** The device flow as the desktop app runs it: code, claim and approval, then the token. */
async function deviceToken(app: App, cookie: string) {
  const code = await app.request("/api/auth/device/code", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ client_id: "kaneo-cli" }),
  });
  const { device_code, user_code } = (await code.json()) as {
    device_code: string;
    user_code: string;
  };
  const claim = await app.request(
    `/api/auth/device?user_code=${encodeURIComponent(user_code)}`,
    { headers: { Origin: origin, Cookie: cookie } },
  );
  expect(claim.status).toBe(200);
  const approve = await app.request("/api/auth/device/approve", {
    method: "POST",
    headers: { ...json, Cookie: cookie },
    body: JSON.stringify({ userCode: user_code }),
  });
  expect(approve.status).toBe(200);
  const token = await app.request("/api/auth/device/token", {
    method: "POST",
    headers: json,
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code,
      client_id: "kaneo-cli",
    }),
  });
  expect(token.status).toBe(200);
  return ((await token.json()) as { access_token: string }).access_token;
}

describe("API integration: desktop session", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("turns a device-flow token into a working session cookie", async () => {
    const { app } = createApp();
    const { email, cookie } = await signedInCookie(app);
    const token = await deviceToken(app, cookie);

    const response = await app.request("/api/desktop/session", {
      method: "POST",
      headers: { Origin: origin, Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(204);
    const desktopCookie = cookiesOf(response);
    expect(desktopCookie).toContain("session_token=");

    const session = await app.request("/api/auth/get-session", {
      headers: { Origin: origin, Cookie: desktopCookie },
    });
    expect(session.status).toBe(200);
    const body = (await session.json()) as { user?: { email: string } };
    expect(body.user?.email).toBe(email);
  });

  it("ends with the identity provider's logout of the approving session", async () => {
    const { app } = createApp();
    const { cookie } = await signedInCookie(app);
    const browser = await app.request("/api/auth/get-session", {
      headers: { Origin: origin, Cookie: cookie },
    });
    const { session: browserSession } = (await browser.json()) as {
      session: { id: string };
    };
    // The browser signed in through single sign-on, so its session has the provider's id.
    await db
      .update(schema.sessionTable)
      .set({ oidcSid: "idp-session-1" })
      .where(eq(schema.sessionTable.id, browserSession.id));

    const token = await deviceToken(app, cookie);
    const response = await app.request("/api/desktop/session", {
      method: "POST",
      headers: { Origin: origin, Authorization: `Bearer ${token}` },
    });
    const desktopCookie = cookiesOf(response);
    const before = await app.request("/api/auth/get-session", {
      headers: { Origin: origin, Cookie: desktopCookie },
    });
    expect(((await before.json()) as { user?: unknown }).user).toBeTruthy();

    await endProviderSessions({
      iss: "https://idp.example.test",
      jti: randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      sid: "idp-session-1",
    });
    const after = await app.request(
      "/api/auth/get-session?disableCookieCache=true",
      {
        headers: { Origin: origin, Cookie: desktopCookie },
      },
    );
    expect(await after.json()).toBeNull();
  });

  it("takes the provider session id of the person's own live session", async () => {
    const { app } = createApp();
    const sessionOf = async (sessionCookie: string) => {
      const response = await app.request(
        "/api/auth/get-session?disableCookieCache=true",
        { headers: { Origin: origin, Cookie: sessionCookie } },
      );
      return (
        (await response.json()) as {
          session: { id: string; userId: string };
        }
      ).session;
    };
    const setSid = (id: string, oidcSid: string) =>
      db
        .update(schema.sessionTable)
        .set({ oidcSid })
        .where(eq(schema.sessionTable.id, id));
    const { cookie } = await signedInCookie(app);
    const browser = await sessionOf(cookie);
    await setSid(browser.id, "idp-session-1");
    // Newer single sign-on sessions that must not count: another person's, and an expired one.
    const other = await signedInCookie(app);
    await setSid((await sessionOf(other.cookie)).id, "idp-other");
    const later = new Date(Date.now() + 60_000);
    await db.insert(schema.sessionTable).values({
      id: randomUUID(),
      token: randomUUID(),
      userId: browser.userId,
      oidcSid: "idp-expired",
      expiresAt: new Date(Date.now() - 60_000),
      createdAt: later,
      updatedAt: later,
    });

    const token = await deviceToken(app, cookie);
    const response = await app.request("/api/desktop/session", {
      method: "POST",
      headers: { Origin: origin, Authorization: `Bearer ${token}` },
    });
    const desktop = await sessionOf(cookiesOf(response));
    const [row] = await db
      .select({ oidcSid: schema.sessionTable.oidcSid })
      .from(schema.sessionTable)
      .where(eq(schema.sessionTable.id, desktop.id));
    expect(row?.oidcSid).toBe("idp-session-1");
  });

  it("refuses a cookie session without a bearer token", async () => {
    const { app } = createApp();
    const { cookie } = await signedInCookie(app);
    const response = await app.request("/api/desktop/session", {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
    });
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("refuses an API key as the bearer token", async () => {
    const member = await createWorkspaceMember();
    const rawKey = `kaneo_test_${randomUUID()}`;
    const hashed = createHash("sha256")
      .update(rawKey)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const now = new Date();
    await db.insert(schema.apikeyTable).values({
      referenceId: member.user.id,
      userId: member.user.id,
      key: hashed,
      name: "desktop session test",
      start: rawKey.slice(0, 12),
      prefix: "kaneo",
      createdAt: now,
      updatedAt: now,
    });
    const { app } = createApp();
    const response = await app.request("/api/desktop/session", {
      method: "POST",
      headers: { Origin: origin, Authorization: `Bearer ${rawKey}` },
    });
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("does not let a browser mint a one-time token", async () => {
    const { app } = createApp();
    const { cookie } = await signedInCookie(app);
    const response = await app.request("/api/auth/one-time-token/generate", {
      headers: { Origin: origin, Cookie: cookie },
    });
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain('"token"');
  });
});
