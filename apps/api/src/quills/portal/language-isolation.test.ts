import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import type { PrincipalId } from "@kaneo/ids";
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
import { recipientDirection } from "../jobs/handlers/recipient-language";
import publicRouter from "../public";
import { scene } from "./feedback/seed.fixture";

// Issues #76 and #117: a customer's saved language belongs to one workspace. It picks their
// translations, changelog versions and the direction of their portal and mail there, and never
// changes what the same account reads in another workspace.

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

const language = async (workspace: string, method = "GET", body?: unknown) => {
  const res = await app.request(`/quills-public/${workspace}/user/language`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-test-user": contractEnv().customerA,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  return { status: res.status, body: await res.json() };
};

describe.skipIf(!url)("A customer's language in each workspace", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
    await scene(contractEnv(), "portal");
  }, 120000);
  afterAll(async () => {
    await stopContract();
  });

  it("keeps Arabic in workspace A from changing workspace B", async () => {
    const env = contractEnv();
    const inB = await env.portalCustomer(env.b, env.customerA);
    const inA = await env.portalCustomer(env.a, env.customerA);
    expect((await language(env.a, "PUT", { language: "ar-EG" })).status).toBe(
      200,
    );
    expect((await language(env.a)).body.language).toBe("ar-EG");
    expect((await language(env.b)).body.language).toBeNull();
    // The mail of each workspace follows only its own saved language.
    expect(
      await env.scoped(env.a, (db) =>
        recipientDirection(db, inA.principalId as PrincipalId),
      ),
    ).toBe("rtl");
    expect(
      await env.scoped(env.b, (db) =>
        recipientDirection(db, inB.principalId as PrincipalId),
      ),
    ).toBe("ltr");
    // A's principal is not visible from B's scope, so it reads as no language there.
    expect(
      await env.scoped(env.b, (db) =>
        recipientDirection(db, inA.principalId as PrincipalId),
      ),
    ).toBe("ltr");
  });
});
