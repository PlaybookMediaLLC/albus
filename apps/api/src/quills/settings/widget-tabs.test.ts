import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { settings } from "../../database/quills/schema/auth";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import publicRouter from "../public";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import { widgetTabs } from "./widget-tabs";

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
const today = { changelog: true, messenger: true };
const older = { changelog: false, messenger: false };

describe("widgetTabs", () => {
  it("gives today's defaults to a blob without a tabs object", () => {
    expect(widgetTabs({})).toMatchObject(today);
    expect(widgetTabs({ enabled: true })).toMatchObject(today);
    expect(widgetTabs({ tabs: { feedback: true } })).toMatchObject(older);
  });
});

describe.skipIf(!url)("widget tab defaults", () => {
  const settingsTabs = async () => {
    const env = contractEnv();
    const res = await app.request(`/quills/${env.a}/settings/widget`, {
      headers: { "x-test-user": env.owner },
    });
    return (await res.json()).tabs;
  };
  const save = (body: unknown) => {
    const env = contractEnv();
    return app.request(`/quills/${env.a}/settings/widget`, {
      method: "PUT",
      headers: { "x-test-user": env.owner, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  };
  const widgetTabsOf = async () => {
    const res = await app.request(
      `/quills-public/${contractEnv().a}/widget/config.json`,
    );
    return (await res.json()).config.tabs;
  };
  const store = (widgetConfig: string | null) => {
    const env = contractEnv();
    return env.scoped(env.a, (db) => db.update(settings).set({ widgetConfig }));
  };

  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
  }, 120000);
  afterAll(() => stopContract());

  it("keeps today's tab defaults before and after the first write", async () => {
    await store(null);
    expect(await settingsTabs()).toMatchObject(today);
    expect((await save({ enabled: true })).status).toBe(200);
    expect(await settingsTabs()).toMatchObject(today);
    expect(await widgetTabsOf()).toMatchObject(today);

    // A tabs write stores all six tabs, so the other tabs keep their values.
    expect((await save({ tabs: { help: true } })).status).toBe(200);
    const tabs = await settingsTabs();
    expect(tabs).toMatchObject({ ...today, help: true });
    expect(await widgetTabsOf()).toEqual(tabs);
    const env = contractEnv();
    const [row] = await env.scoped(env.a, (db) =>
      db.select({ widgetConfig: settings.widgetConfig }).from(settings),
    );
    expect(JSON.parse(row!.widgetConfig!).tabs).toEqual(tabs);
  });

  it("keeps the older defaults of an older stored tabs object", async () => {
    await store(JSON.stringify({ enabled: true, tabs: { feedback: true } }));
    expect(await settingsTabs()).toMatchObject(older);
    expect(await widgetTabsOf()).toMatchObject(older);
  });
});
