import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { auditLog } from "../../database/quills/schema/audit-log";
import { settings } from "../../database/quills/schema/auth";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import {
  contractApp,
  contractEnv,
  startContract,
  stopContract,
} from "../framework/contract";

let pool: Pool;
vi.mock("../../database/index", () => ({
  getDatabasePool: () => pool,
  get schema() {
    return kaneo;
  },
  default: new Proxy(
    {},
    {
      get(_target, property) {
        const db = drizzle(pool, { schema: kaneo });
        const value = Reflect.get(db, property);
        return typeof value === "function" ? value.bind(db) : value;
      },
    },
  ),
}));
const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter);
const member = `settings_member_${Date.now().toString(36)}`;

async function call(method: string, path: string, as?: string, body?: unknown) {
  const env = contractEnv();
  const res = await app.request(`/quills/${env.a}${path}`, {
    method,
    headers: {
      "x-test-user": as ?? env.owner,
      ...(body !== undefined && { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

describe.skipIf(!url)("Quills settings", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
    const env = contractEnv();
    await env.db.insert(kaneo.userTable).values({
      id: member,
      name: member,
      email: `${member}@example.test`,
    });
    await env.db.insert(kaneo.workspaceUserTable).values({
      workspaceId: env.a,
      userId: member,
      role: "member",
      joinedAt: new Date(),
    });
  }, 120000);
  afterAll(async () => {
    await pool.query("DELETE FROM public.workspace_member WHERE user_id = $1", [
      member,
    ]);
    await pool.query('DELETE FROM public."user" WHERE id = $1', [member]);
    await stopContract();
  });

  it("keeps the widget secret out of general reads and away from members", async () => {
    const first = await call("POST", "/settings/widget/secret");
    const second = await call("POST", "/settings/widget/secret");
    expect(first.status).toBe(200);
    const secret = JSON.parse(second.text).secret as string;
    expect(secret).toMatch(/^wgt_[0-9a-f]{64}$/);
    expect(secret).not.toBe(JSON.parse(first.text).secret);

    for (const path of [
      "/settings",
      "/settings/widget",
      "/settings/portal",
      "/settings/branding",
      "/settings/developer",
      "/settings/labs",
    ]) {
      const read = await call("GET", path);
      expect(read.status).toBe(200);
      expect(read.text).not.toContain(secret);
      expect(read.text.toLowerCase()).not.toContain("secret");
    }
    expect(
      JSON.parse((await call("GET", "/settings/widget/secret")).text),
    ).toEqual({
      secret,
    });

    // A member reads Quills data but cannot see or rotate the secret, or read settings areas.
    expect((await call("GET", "/settings", member)).status).toBe(200);
    for (const [method, path] of [
      ["GET", "/settings/widget/secret"],
      ["POST", "/settings/widget/secret"],
      ["POST", "/settings/widget/install-code"],
      ["GET", "/settings/widget"],
    ] as const)
      expect((await call(method, path, member)).status).toBe(403);
  });

  it("defaults the widget to on, creates a missing secret when it is on, and keeps it out of the audit", async () => {
    const env = contractEnv();
    const secretOf = async () =>
      JSON.parse((await call("GET", "/settings/widget/secret")).text).secret as
        | string
        | null;
    const reset = (widgetConfig: string | null) =>
      env.scoped(env.a, (db) =>
        db.update(settings).set({ widgetSecret: null, widgetConfig }),
      );
    // A workspace that never set the widget has it on, and its first save creates the secret.
    await reset(null);
    const fresh = JSON.parse((await call("GET", "/settings/widget")).text);
    expect(fresh.enabled).toBe(true);
    await call("PUT", "/settings/widget", undefined, { launcherLabel: "Hi" });
    expect(await secretOf()).toMatch(/^wgt_[0-9a-f]{64}$/);

    // A save while the widget is turned off creates nothing; a member cannot turn it on.
    await reset(JSON.stringify({ enabled: false }));
    const off = { launcherLabel: "Help" };
    expect((await call("PUT", "/settings/widget", undefined, off)).status).toBe(
      200,
    );
    expect(await secretOf()).toBeNull();
    expect(
      (await call("PUT", "/settings/widget", member, { enabled: true })).status,
    ).toBe(403);
    expect(await secretOf()).toBeNull();

    const on = await call("PUT", "/settings/widget", undefined, {
      enabled: true,
    });
    expect(on.status).toBe(200);
    const secret = await secretOf();
    expect(secret).toMatch(/^wgt_[0-9a-f]{64}$/);
    expect(on.text).not.toContain(secret);
    // A later save keeps the secret, so identify tokens and sessions stay valid.
    await call("PUT", "/settings/widget", undefined, { launcherLabel: "Ask" });
    expect(await secretOf()).toBe(secret);
    const audit = await env.scoped(env.a, (db) =>
      db.select({ metadata: auditLog.metadata }).from(auditLog),
    );
    expect(JSON.stringify(audit)).not.toContain(secret);
  });

  it("stores the install code hashed and never writes the name or slug", async () => {
    const env = contractEnv();
    const minted = await call("POST", "/settings/widget/install-code");
    const { code } = JSON.parse(minted.text) as { code: string };
    expect(code).toMatch(/^qbi_/);
    const stored = await pool.query(
      "SELECT key, value FROM quills.kv_store WHERE workspace_id = $1 AND key LIKE 'widget:install-pairing:%'",
      [env.a],
    );
    expect(JSON.stringify(stored.rows)).not.toContain(code);
    expect(stored.rows).toHaveLength(1);

    const before = await env.scoped(env.a, (db) =>
      db.select({ name: settings.name, slug: settings.slug }).from(settings),
    );
    const updated = await call("PUT", "/settings/branding", undefined, {
      headerDisplayName: "Portal",
      name: "Hijacked",
      slug: "hijacked",
    });
    expect(updated.status).toBe(200);
    const after = await env.scoped(env.a, (db) =>
      db
        .select({ name: settings.name, slug: settings.slug })
        .from(settings)
        .where(eq(settings.workspaceId, env.a)),
    );
    expect(after).toEqual(before);
  });
});
