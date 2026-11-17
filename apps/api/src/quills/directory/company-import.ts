import { eq, inArray, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { companies } from "../../database/quills/schema/companies";
import {
  defineQuillsRoute,
  validationError,
  type Database,
} from "../framework/define-route";
import { parseCsv } from "../transfer/runs/csv";
import { revenueDenied, seesRevenue } from "../feedback/schemas";

// Company CSV import (#79): creates companies and sets their revenue. All rows or none.

export const MAX_COMPANY_ROWS = 1000;
const columns = ["name", "domain", "external_id", "plan", "mrr"] as const;
type Column = (typeof columns)[number];
const limits: Record<Column, number> = {
  name: 200,
  domain: 255,
  external_id: 255,
  plan: 100,
  mrr: 20,
};
const MAX_CENTS = 2147483647;

type Row = {
  line: number;
  name?: string;
  domain?: string;
  externalId?: string;
  plan?: string;
  mrrCents?: number;
};

/** Monthly revenue in major units ("1250.50") as cents, or undefined when it is not a plain amount. */
export function parseMrr(text: string) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(text)) return undefined;
  const cents = Math.round(Number(text) * 100);
  return cents <= MAX_CENTS ? cents : undefined;
}

/** The rows of the file, or every problem found in it. An empty cell leaves that field as it is. */
export function readCompanyCsv(text: string) {
  const errors: string[] = [];
  let records: string[][];
  try {
    records = parseCsv(text);
  } catch (error) {
    return { rows: [], errors: [(error as Error).message] };
  }
  const [header = [], ...data] = records;
  const names = header.map((cell) => cell.trim().toLowerCase());
  for (const name of names)
    if (!(columns as readonly string[]).includes(name))
      errors.push(`Unknown column "${name}". Use ${columns.join(", ")}.`);
  if (new Set(names).size !== names.length)
    errors.push("A column appears twice.");
  if (!data.length) errors.push("The file has no rows.");
  if (data.length > MAX_COMPANY_ROWS)
    errors.push(`The file has more than ${MAX_COMPANY_ROWS} rows.`);
  if (errors.length) return { rows: [], errors };
  const rows: Row[] = data.map((record, index) => {
    const line = index + 2;
    const cell = (column: Column) => {
      const at = names.indexOf(column);
      const value = at < 0 ? "" : (record[at] ?? "").trim();
      if (value.length > limits[column])
        errors.push(
          `Row ${line}: ${column} is longer than ${limits[column]} characters.`,
        );
      return value || undefined;
    };
    const mrr = cell("mrr");
    const mrrCents = mrr === undefined ? undefined : parseMrr(mrr);
    if (mrr !== undefined && mrrCents === undefined)
      errors.push(`Row ${line}: mrr must be an amount such as 1250.50.`);
    const row = {
      line,
      name: cell("name"),
      domain: cell("domain"),
      externalId: cell("external_id"),
      plan: cell("plan"),
      mrrCents,
    };
    if (!row.name && !row.domain && !row.externalId)
      errors.push(`Row ${line}: give a name, a domain or an external_id.`);
    return row;
  });
  // One row per company: a repeated key would make the result depend on row order.
  for (const key of ["externalId", "domain"] as const) {
    const seen = new Map<string, number>();
    for (const row of rows) {
      const value = row[key]?.toLowerCase();
      if (!value) continue;
      const first = seen.get(value);
      if (first)
        errors.push(
          `Row ${row.line}: the same ${key === "domain" ? "domain" : "external_id"} as row ${first}.`,
        );
      else seen.set(value, row.line);
    }
  }
  return { rows, errors };
}

const importCompanies = defineQuillsRoute({
  method: "post",
  path: "/companies/import",
  operationId: "importQuillsCompanies",
  summary: "Create or update companies, with their revenue, from a CSV file",
  description: `The CSV text, with a header row of these columns in any order: name, domain, external_id, plan and mrr (the monthly revenue in major units, such as 1250.50), at most 100,000 characters. A row updates the company with its external_id, else the company with its domain, else creates a company, which needs a name. An empty cell leaves that field as it is. Up to ${MAX_COMPANY_ROWS} rows. One invalid row rejects the file with every row's problem, and nothing changes.`,
  action: "manage_settings",
  callerActions: true,
  body: z.object({ csv: z.string().min(1).max(100_000) }),
  response: z.object({ created: z.number(), updated: z.number() }),
  responseDescription: "How many companies the file created and updated",
  errors: {
    400: "The file has invalid rows",
    409: "A parallel change added one of the companies",
  },
  event: ({ workspaceId }, result) => ({
    type: "company.imported",
    entityType: "workspace",
    entityId: workspaceId,
    payload: {
      created: String(result.created),
      updated: String(result.updated),
    },
  }),
  handler: async ({ db, body, actions }) => {
    const { rows, errors } = readCompanyCsv(body.csv);
    // Setting revenue needs quills:view_revenue (#79); the other columns do not.
    if (rows.some((r) => r.mrrCents !== undefined) && !seesRevenue(actions))
      throw revenueDenied();
    // Each problem is an issue on body.csv; the message lists the first 20.
    const fail = (problems: string[]) =>
      validationError(
        problems.slice(0, 100).map((message) => ({ path: ["csv"], message })),
        "json",
        problems.slice(0, 20).join(" "),
      );
    if (errors.length) throw fail(errors);
    const externalIds = rows.flatMap((r) => r.externalId ?? []);
    const domains = rows.flatMap((r) => r.domain?.toLowerCase() ?? []);
    // The workspace's companies that a row names, locked so a parallel import waits for this one.
    const existing = await db
      .select({
        id: companies.id,
        externalId: companies.externalId,
        domain: sql<string | null>`lower(${companies.domain})`,
      })
      .from(companies)
      .where(
        externalIds.length || domains.length
          ? sql`${externalIds.length ? inArray(companies.externalId, externalIds) : sql`false`} or ${domains.length ? inArray(sql`lower(${companies.domain})`, domains) : sql`false`}`
          : sql`false`,
      )
      .for("update");
    const byExternal = new Map(existing.map((c) => [c.externalId, c.id]));
    const byDomain = new Map(existing.map((c) => [c.domain, c.id]));
    const problems: string[] = [];
    const plan = rows.map((row) => {
      const id =
        (row.externalId && byExternal.get(row.externalId)) ||
        (row.domain && byDomain.get(row.domain.toLowerCase())) ||
        undefined;
      // A key that another company holds would move it, or break the unique index.
      const external = row.externalId && byExternal.get(row.externalId);
      const domain = row.domain && byDomain.get(row.domain.toLowerCase());
      if ((external && external !== id) || (domain && domain !== id))
        problems.push(
          `Row ${row.line}: its domain and external_id belong to different companies.`,
        );
      if (!id && !row.name)
        problems.push(`Row ${row.line}: a new company needs a name.`);
      return { row, id };
    });
    // Two rows may name one company through different keys: the result would depend on row order.
    const seen = new Map<string, number>();
    for (const { row, id } of plan) {
      if (!id) continue;
      const first = seen.get(id);
      if (first)
        problems.push(`Row ${row.line}: the same company as row ${first}.`);
      else seen.set(id, row.line);
    }
    if (problems.length) throw fail(problems);
    try {
      return await write(db, plan);
    } catch (error) {
      // A parallel write added a company with one of these keys after the read above.
      const code =
        (error as { code?: string; cause?: { code?: string } }).cause?.code ??
        (error as { code?: string }).code;
      if (code === "23505")
        throw new HTTPException(409, {
          message: "Another change added one of these companies. Try again.",
        });
      throw error;
    }
  },
});

/** Updates the matched companies and creates the others. */
async function write(
  db: Database,
  plan: { row: Row; id: (typeof companies.$inferSelect)["id"] | undefined }[],
) {
  let created = 0;
  for (const { row, id } of plan) {
    const values = {
      name: row.name,
      domain: row.domain,
      externalId: row.externalId,
      plan: row.plan,
      mrrCents: row.mrrCents,
    };
    if (id) await db.update(companies).set(values).where(eq(companies.id, id));
    else {
      await db
        .insert(companies)
        .values({ ...values, name: row.name!, source: "manual" });
      created++;
    }
  }
  return { created, updated: plan.length - created };
}

export default apiRouter<BaseVariables & { workspaceId: string }>().openapi(
  ...importCompanies,
);
