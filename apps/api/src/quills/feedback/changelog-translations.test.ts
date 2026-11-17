import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as kaneo from "../../database/schema";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import quillsRouter from "../index";
import publicRouter from "../public";
import { scene, type Scene } from "../portal/feedback/seed.fixture";

// Changelog entries in more than one language (issue #76) through the real routes: a teammate
// writes and removes versions, a customer gets their language or the entry's own text in the
// portal and the widget, events carry no text, and workspaces stay apart.

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
vi.mock("../../utils/get-user-session", () => ({
  getUserSession: (headers: Headers) => contractSession(headers),
}));
const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter, publicRouter);
let client = 0;

async function call(
  method: string,
  path: string,
  options: { user?: string; bearer?: string; body?: unknown } = {},
) {
  const res = await app.request(path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(options.user && { "x-test-user": options.user }),
      ...(options.bearer && { authorization: `Bearer ${options.bearer}` }),
      "x-kaneo-client-ip": `198.51.100.${++client % 250}`,
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  });
  return { status: res.status, body: await res.json() };
}

describe.skipIf(!url)("Quills changelog translations", () => {
  let s: Scene;
  let env: ReturnType<typeof contractEnv>;
  let widgetToken: string;
  const teammate = (
    method: string,
    path: string,
    body?: unknown,
    user?: string,
  ) =>
    call(method, `/quills/${env.a}${path}`, { user: user ?? env.owner, body });
  const portal = (path: string) =>
    call("GET", `/quills-public/${env.a}/portal${path}`, {
      user: env.customerA,
    });
  const widget = (path: string) =>
    call("GET", `/quills-public/${env.a}/widget${path}`, {
      bearer: widgetToken,
    });

  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
    env = contractEnv();
    s = await scene(env, "portal");
    widgetToken = (await env.widgetVisitor(env.a)).token;
  }, 120000);
  afterAll(async () => {
    await stopContract();
  });

  it("serves a customer the version in their language, else the entry's own text", async () => {
    const entry = s.a.entryId;
    const own = (await portal(`/changelog/${entry}`)).body;
    expect(own.locale).toBeNull();
    const saved = await teammate("PUT", `/changelog/${entry}/translations`, {
      locale: "de-AT",
      title: "Ausgeliefert",
      content: "Jetzt verfügbar",
    });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ locale: "de", title: "Ausgeliefert" });
    // A second save replaces the version.
    await teammate("PUT", `/changelog/${entry}/translations`, {
      locale: "de",
      title: "Ausgeliefert!",
      content: "Jetzt verfügbar",
    });
    expect(
      (await teammate("GET", `/changelog/${entry}/translations`)).body.items,
    ).toEqual([
      expect.objectContaining({ locale: "de", title: "Ausgeliefert!" }),
    ]);

    for (const read of [portal, widget]) {
      const german = (await read(`/changelog/${entry}?locale=de-CH`)).body;
      expect(german).toMatchObject({
        title: "Ausgeliefert!",
        content: "Jetzt verfügbar",
        locale: "de",
      });
      const list = (await read("/changelog?locale=de")).body.entries;
      expect(list.find((e: { id: string }) => e.id === entry)).toMatchObject({
        title: "Ausgeliefert!",
        locale: "de",
      });
      // No French version: the default language.
      expect((await read(`/changelog/${entry}?locale=fr`)).body).toMatchObject({
        title: own.title,
        content: own.content,
        locale: null,
      });
      expect((await read(`/changelog/${entry}`)).body.locale).toBeNull();
    }
    expect((await portal(`/changelog/${entry}?locale=not a tag`)).status).toBe(
      400,
    );

    // Removing the version brings back the entry's own text.
    expect(
      (await teammate("DELETE", `/changelog/${entry}/translations/de`)).status,
    ).toBe(200);
    expect((await portal(`/changelog/${entry}?locale=de`)).body).toMatchObject({
      title: own.title,
      locale: null,
    });
    expect(
      (await teammate("DELETE", `/changelog/${entry}/translations/de`)).status,
    ).toBe(404);
  });

  it("records the language in events and never the text", async () => {
    await teammate("PUT", `/changelog/${s.a.entryId}/translations`, {
      locale: "ar",
      title: "تم الإطلاق",
      content: "متاح الآن",
    });
    const { rows } = await pool.query(
      "SELECT type, payload FROM quills.events WHERE workspace_id=$1 AND type LIKE 'changelog.translation_%' ORDER BY id",
      [env.a],
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows)
      expect(Object.keys(row.payload)).toEqual(["locale"]);
    expect(JSON.stringify(rows)).not.toContain("متاح");
  });

  it("keeps each workspace's versions to itself", async () => {
    // B's teammate writes a version of B's entry; A's paths cannot reach B's entry.
    const other = await call(
      "PUT",
      `/quills/${env.b}/changelog/${s.b.entryId}/translations`,
      { user: env.outsider, body: { locale: "de", title: "B", content: "B" } },
    );
    expect(other.status).toBe(200);
    for (const [method, path] of [
      ["GET", `/changelog/${s.b.entryId}/translations`],
      ["PUT", `/changelog/${s.b.entryId}/translations`],
      ["DELETE", `/changelog/${s.b.entryId}/translations/de`],
    ] as const)
      expect(
        (
          await teammate(
            method,
            path,
            method === "PUT"
              ? { locale: "de", title: "A", content: "A" }
              : undefined,
          )
        ).status,
      ).toBe(404);
    // B's owner is not a member of A.
    expect(
      (
        await teammate(
          "PUT",
          `/changelog/${s.a.entryId}/translations`,
          { locale: "fr", title: "x", content: "x" },
          env.outsider,
        )
      ).status,
    ).toBe(404);
    expect((await portal(`/changelog/${s.b.entryId}?locale=de`)).status).toBe(
      404,
    );
    const { rows } = await pool.query(
      "SELECT title FROM quills.changelog_translations WHERE workspace_id=$1 AND locale='de'",
      [env.b],
    );
    expect(rows).toEqual([{ title: "B" }]);
  });
});
