import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { auditLog } from "../../database/quills/schema/audit-log";
import { companies } from "../../database/quills/schema/companies";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import {
  contractApp,
  contractEnv,
  startContract,
  stopContract,
} from "../framework/contract";
import { call } from "../feedback/taxonomy-harness.fixture";
import { parseMrr, readCompanyCsv } from "./company-import";

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
const upload = (csv: string) =>
  call(app, contractEnv(), contractEnv().owner, "POST", "/companies/import", {
    csv,
  });

describe("Company CSV parsing", () => {
  it("reads revenue in major units only", () => {
    expect(parseMrr("1250.50")).toBe(125050);
    expect(parseMrr("0")).toBe(0);
    expect(parseMrr("19.9")).toBe(1990);
    for (const bad of ["12,5", "$10", "-1", "1.234", "1e3", "21474837"])
      expect(parseMrr(bad)).toBeUndefined();
  });
  it("names every bad row and repeated key", () => {
    const { errors } = readCompanyCsv(
      "Name,MRR,domain\nAcme,ten,acme.test\n,,\nOther,5,ACME.test\n",
    );
    expect(errors).toEqual([
      "Row 2: mrr must be an amount such as 1250.50.",
      "Row 3: give a name, a domain or an external_id.",
      "Row 4: the same domain as row 2.",
    ]);
    expect(readCompanyCsv("name,revenue\nAcme,1").errors[0]).toMatch(
      /Unknown column "revenue"/,
    );
  });
});

describe.skipIf(!url)("Company CSV import", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
  }, 120000);
  afterAll(() => stopContract(), 120000);

  it("updates by external_id, then by domain, creates the rest, and audits counts only", async () => {
    const env = contractEnv();
    const tag = env.id("import");
    const [byExternal, byDomain] = await env.scoped(env.a, (db) =>
      db
        .insert(companies)
        .values([
          { name: "Old name", externalId: `${tag}-crm` },
          { name: "Domain Co", domain: `${tag}.test`, plan: "Free" },
        ])
        .returning({ id: companies.id }),
    );
    const res = await upload(
      [
        "external_id,name,mrr,domain,plan",
        `${tag}-crm,Renamed,99.99,,`,
        `,,1250.50,${tag.toUpperCase()}.TEST,`,
        `,New Co,10,new-${tag}.test,Scale`,
      ].join("\n"),
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ created: 1, updated: 2 });
    const rows = await env.scoped(env.a, (db) =>
      db
        .select({
          id: companies.id,
          name: companies.name,
          plan: companies.plan,
          mrrCents: companies.mrrCents,
        })
        .from(companies)
        .where(inArray(companies.name, ["Renamed", "Domain Co", "New Co"])),
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        { id: byExternal!.id, name: "Renamed", plan: null, mrrCents: 9999 },
        { id: byDomain!.id, name: "Domain Co", plan: "Free", mrrCents: 125050 },
        expect.objectContaining({
          name: "New Co",
          plan: "Scale",
          mrrCents: 1000,
        }),
      ]),
    );
    // Other tests import in the same workspace: look for this run's counts among the rows.
    const audits = await env.scoped(env.a, (db) =>
      db
        .select({ metadata: auditLog.metadata })
        .from(auditLog)
        .where(
          and(
            eq(auditLog.eventType, "company.imported"),
            eq(auditLog.targetId, env.a),
          ),
        ),
    );
    expect(audits.map((a) => a.metadata)).toContainEqual({
      created: "1",
      updated: "2",
    });
  });

  it("rejects the whole file for one bad row or a key held by another company, and changes nothing", async () => {
    const env = contractEnv();
    const tag = env.id("bad");
    await env.scoped(env.a, (db) =>
      db.insert(companies).values([
        { name: "First", externalId: `${tag}-1` },
        { name: "Second", domain: `${tag}.test` },
      ]),
    );
    const count = () => env.scoped(env.a, (db) => db.$count(companies));
    const before = await count();
    const bad = await upload(`name,mrr\nGood,1\nBad,12;5`);
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe("VALIDATION_ERROR");
    expect(bad.body.message).toContain("Row 3: mrr must be an amount");
    const crossed = await upload(
      `name,external_id,domain\nGood,,good-${tag}.test\nMixed,${tag}-1,${tag}.test`,
    );
    expect(crossed.status).toBe(400);
    expect(crossed.body.message).toContain(
      "Row 3: its domain and external_id belong to different companies.",
    );
    // Two rows that reach one company through different keys.
    await env.scoped(env.a, (db) =>
      db.insert(companies).values({
        name: "Both",
        externalId: `${tag}-3`,
        domain: `three-${tag}.test`,
      }),
    );
    const twice = await upload(
      `external_id,domain,mrr\n${tag}-3,,100\n,three-${tag}.test,900`,
    );
    expect(twice.status).toBe(400);
    expect(twice.body.message).toContain("Row 3: the same company as row 2.");
    expect(await count()).toBe(before + 1);
  });

  it("matches only the caller's workspace", async () => {
    const env = contractEnv();
    const tag = env.id("tenant");
    const [foreign] = await env.scoped(env.b, (db) =>
      db
        .insert(companies)
        .values({ name: "B's company", externalId: `${tag}-crm`, mrrCents: 5 })
        .returning({ id: companies.id }),
    );
    const res = await upload(`external_id,name,mrr\n${tag}-crm,A's company,7`);
    expect(res.body).toEqual({ created: 1, updated: 0 });
    const [b] = await env.scoped(env.b, (db) =>
      db
        .select({ name: companies.name, mrrCents: companies.mrrCents })
        .from(companies)
        .where(eq(companies.id, foreign!.id)),
    );
    expect(b).toEqual({ name: "B's company", mrrCents: 5 });
  });
});
