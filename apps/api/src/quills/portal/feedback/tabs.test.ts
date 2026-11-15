import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createId } from "@kaneo/ids";
import { settings } from "../../../database/quills/schema/auth";
import * as kaneo from "../../../database/schema";
import quillsRouter from "../../index";
import publicRouter from "../../public";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../../framework/contract";
import { NAV_TABS } from "../nav";
import { portalPaths } from "../paths";
import { scene } from "./seed.fixture";

// The portal roadmap and changelog tabs (portalConfig.nav) from end to end. A teammate turns a
// tab off with the settings route. The public config shows it, and each customer route of that
// tab answers like a missing record. Teammate routes do not change.

let pool: Pool;
vi.mock("../../../database/index", () => ({
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
vi.mock("../../../utils/get-user-session", () => ({
  getUserSession: (headers: Headers) => contractSession(headers),
}));
const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter, publicRouter);
let client = 0;

/** A request in workspace A: under /quills as the owner with `teammate`, else /quills-public. */
async function call(
  path: string,
  options: { teammate?: boolean; bearer?: string; body?: unknown } = {},
) {
  const env = contractEnv();
  const res = await app.request(
    `/${options.teammate ? "quills" : "quills-public"}/${env.a}${path}`,
    {
      method: options.body === undefined ? "GET" : "PUT",
      headers: {
        ...(options.teammate && { "x-test-user": env.owner }),
        ...(options.bearer && { authorization: `Bearer ${options.bearer}` }),
        ...(options.body !== undefined && {
          "content-type": "application/json",
        }),
        // A fresh client per request keeps these checks under the rate limits.
        "x-kaneo-client-ip": `203.0.113.${++client % 250}`,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    },
  );
  return { status: res.status, text: await res.text() };
}

/** Saves the tab list the way the settings switches do. */
async function saveNav(nav: Record<string, unknown>[]) {
  expect(
    (await call("/settings/portal", { teammate: true, body: { nav } })).status,
  ).toBe(200);
}
const tab = (type: string, enabled: boolean) => ({ id: type, type, enabled });
const link = (label: string, url: string, extra = {}) => ({
  id: label,
  type: "link",
  label,
  url,
  ...extra,
});
const config = async () => JSON.parse((await call("/portal/config")).text).nav;
const on = Object.fromEntries(NAV_TABS.map((type) => [type, true]));

describe.skipIf(!url)("Quills portal tabs", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
  }, 120000);
  afterAll(() => stopContract());

  it("shows the tabs and the safe custom links in the public config", async () => {
    const env = contractEnv();
    await scene(env, "portal");
    expect(await config()).toEqual({ tabs: on, links: [] });
    const docs = "https://docs.example.test";
    await saveNav([
      tab("roadmap", false),
      tab("changelog", false),
      link("Docs", docs, { newTab: false }),
      link("Old", "https://old.example.test", { enabled: false }),
    ]);
    expect(await config()).toEqual({
      tabs: { ...on, roadmap: false, changelog: false },
      links: [{ label: "Docs", url: docs, newTab: false }],
    });
    // Rows that the settings route refuses (an import, an older writer) never reach the portal.
    await env.scoped(env.a, (db) =>
      db.update(settings).set({
        portalConfig: JSON.stringify({
          enabled: true,
          nav: {
            items: [
              link("Run", "javascript:alert(1)"),
              link("L".repeat(31), docs),
              { ...link("", docs), id: "blank" },
              { type: "roadmap", enabled: false },
            ],
          },
        }),
      }),
    );
    expect(await config()).toEqual({ tabs: on, links: [] });
    await saveNav([tab("roadmap", true), tab("changelog", true)]);
    expect(await config()).toEqual({ tabs: on, links: [] });
  });

  it("answers 404 on the customer roadmap routes only while the roadmap tab is off", async () => {
    const env = contractEnv();
    const { a } = await scene(env, "portal");
    const posts = `/portal/roadmaps/${a.roadmapId}/posts`;
    const missing = await call(`/portal/roadmaps/${createId("roadmap")}/posts`);
    expect(missing.status).toBe(404);
    expect((await call("/portal/roadmaps")).status).toBe(200);
    expect((await call(posts)).status).toBe(200);
    await saveNav([tab("roadmap", false)]);
    expect(await call("/portal/roadmaps")).toEqual(missing);
    expect(await call(posts)).toEqual(missing);
    // A teammate still reads the roadmap.
    expect((await call("/roadmaps", { teammate: true })).text).toContain(
      a.roadmapId,
    );
    expect(
      (await call(`/roadmaps/${a.roadmapId}/posts`, { teammate: true })).status,
    ).toBe(200);
    await saveNav([tab("roadmap", true)]);
    expect((await call("/portal/roadmaps")).text).toContain(a.roadmapId);
    expect((await call(posts)).status).toBe(200);
  });

  it("answers 404 on the portal, widget and feed changelog while the changelog tab is off", async () => {
    const env = contractEnv();
    const { a, token } = await scene(env, "widget");
    const entry = `/changelog/${a.entryId}`;
    const routes = [
      ["/portal/changelog", undefined],
      [`/portal${entry}`, undefined],
      ["/widget/changelog", token],
      [`/widget${entry}`, token],
      ["/changelog/rss.xml", undefined],
    ] as const;
    const check = async (status: number) => {
      for (const [path, bearer] of routes) {
        const res = await call(path, { bearer });
        expect([path, res.status]).toEqual([path, status]);
        expect(res.text.includes(a.entryId)).toBe(status === 200);
      }
    };
    const sitemap = async () => (await call("/sitemap.xml")).text;
    await check(200);
    expect(await sitemap()).toContain(
      portalPaths.changelogEntry(env.a, a.entryId),
    );
    await saveNav([tab("changelog", false)]);
    await check(404);
    expect(
      (
        await call(`/widget${entry}/reactions`, {
          bearer: token,
          body: { emoji: "👍", reacted: true },
        })
      ).status,
    ).toBe(404);
    const map = await sitemap();
    expect(map).toContain(portalPaths.post(env.a, a.postId));
    expect(map).not.toContain(a.entryId);
    // A teammate still reads the changelog.
    expect((await call("/changelog", { teammate: true })).text).toContain(
      a.entryId,
    );
    await saveNav([tab("changelog", true)]);
    await check(200);
  });
});
