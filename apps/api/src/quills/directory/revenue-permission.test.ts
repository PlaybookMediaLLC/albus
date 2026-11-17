import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { companies } from "../../database/quills/schema/companies";
import { postVotes } from "../../database/quills/schema/posts";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import {
  contractApp,
  contractEnv,
  startContract,
  stopContract,
} from "../framework/contract";
import {
  call,
  removeMembers,
  restrictedMember,
} from "../feedback/taxonomy-harness.fixture";
import { postIn } from "../feedback/seeds.fixture";
import { buildExport } from "../transfer/runs/export-files";
import { customer } from "./seed.fixture";

// quills:view_revenue (#79): customer revenue reaches only teammates who hold it.

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

/** A post with one vote from a customer at a company that pays 500.00 a month. */
async function world() {
  const env = contractEnv();
  const { postId } = await postIn(env, env.a);
  const [company] = await env.scoped(env.a, (db) =>
    db
      .insert(companies)
      .values({ name: env.id("paying"), mrrCents: 50000 })
      .returning({ id: companies.id }),
  );
  const personId = await customer(env, env.a, { companyId: company!.id });
  await env.scoped(env.a, (db) =>
    db.insert(postVotes).values({ postId, principalId: personId }),
  );
  return { postId, companyId: company!.id, personId };
}

describe.skipIf(!url)("The view_revenue permission", () => {
  let without: string;
  let member: string;
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
    const env = contractEnv();
    // Everything a member does with feedback, but not customer revenue.
    const role = env.id("no-revenue");
    await env.db.insert(kaneo.workspaceRoleTable).values({
      workspaceId: env.a,
      role,
      permission: JSON.stringify({
        workspace: ["read"],
        project: ["read"],
        quills: ["read", "create", "update", "delete", "manage_settings"],
      }),
      createdAt: new Date(),
    });
    without = await restrictedMember(env, [], role);
    member = await restrictedMember(env, [], "member");
  }, 120000);
  afterAll(async () => {
    await removeMembers(contractEnv());
    await stopContract();
  }, 120000);
  const as = (user: string, method: string, path: string, body?: unknown) =>
    call(app, contractEnv(), user, method, path, body);

  it("leaves revenue out of reads and refuses revenue sorts, filters and totals without it", async () => {
    const w = await world();
    const listed = await as(without, "GET", "/posts?limit=100");
    expect(listed.status).toBe(200);
    const item = listed.body.items.find(
      (p: { id: string }) => p.id === w.postId,
    );
    expect(item.demand).toMatchObject({ companies: 1, mrrCents: null });
    expect((await as(without, "GET", "/posts?sort=mrr")).status).toBe(403);
    expect((await as(without, "GET", "/posts?minMrrCents=1")).status).toBe(403);
    expect(
      (await as(without, "GET", `/posts/${w.postId}/demand`)).body,
    ).toMatchObject({ companies: 1, mrrCents: null });
    expect((await as(without, "GET", "/feedback/revenue-at-risk")).status).toBe(
      403,
    );
    expect(
      (await as(without, "GET", `/companies/${w.companyId}`)).body.mrrCents,
    ).toBeNull();
    expect(
      (await as(without, "GET", `/users/${w.personId}/company`)).body.company
        .mrrCents,
    ).toBeNull();
    // Nothing that names revenue leaks through the company list either.
    const companyList = await as(without, "GET", "/companies?limit=100");
    expect(
      companyList.body.companies.every(
        (c: { mrrCents: number | null }) => c.mrrCents === null,
      ),
    ).toBe(true);
  });

  it("refuses to set revenue or group people by it without it, and changes nothing", async () => {
    const w = await world();
    expect(
      (
        await as(without, "PUT", `/companies/${w.companyId}`, {
          mrrCents: 1,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await as(without, "POST", "/companies", {
          name: "New",
          mrrCents: 1,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await as(without, "POST", "/companies/import", {
          csv: "name,mrr\nImported,10",
        })
      ).status,
    ).toBe(403);
    // Other company fields stay editable.
    expect(
      (await as(without, "PUT", `/companies/${w.companyId}`, { plan: "Pro" }))
        .status,
    ).toBe(200);
    expect(
      (
        await as(without, "POST", "/segments", {
          name: contractEnv().id("rich"),
          type: "dynamic",
          rules: {
            match: "all",
            conditions: [
              { attribute: "company_mrr", operator: "gt", value: "100" },
            ],
          },
        })
      ).status,
    ).toBe(403);
    const [stored] = await contractEnv().scoped(contractEnv().a, (db) =>
      db
        .select({ mrrCents: companies.mrrCents, plan: companies.plan })
        .from(companies)
        .where(eq(companies.id, w.companyId)),
    );
    expect(stored).toEqual({ mrrCents: 50000, plan: "Pro" });
  });

  it("shows and sorts by revenue for a member, who holds it by default", async () => {
    const w = await world();
    expect(
      (await as(member, "GET", `/posts/${w.postId}/demand`)).body.mrrCents,
    ).toBe(50000);
    expect((await as(member, "GET", "/posts?sort=mrr")).status).toBe(200);
    expect((await as(member, "GET", "/feedback/revenue-at-risk")).status).toBe(
      200,
    );
  });

  it("builds the companies export without monthly_spend unless revenue is allowed", async () => {
    const env = contractEnv();
    const header = async (revenue: boolean) => {
      const built = await env.scoped(env.a, (db) =>
        buildExport(db, "companies", [], revenue),
      );
      return "csv" in built ? built.csv.split("\r\n")[0] : built.error;
    };
    expect(await header(false)).not.toContain("monthly_spend");
    expect(await header(true)).toContain("monthly_spend");
  });
});
