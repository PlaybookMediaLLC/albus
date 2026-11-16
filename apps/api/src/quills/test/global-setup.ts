import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";
import { runQuillsMigrations } from "../../database/quills/migrate";

// Migrate the base database once. Each worker then copies it (worker-database.ts), so the
// workers do not run the migrations at the same time: that exhausts the PostgreSQL lock table
// and races on the cluster-wide quills_runtime role.
export default async function setup() {
  const url = process.env.QUILLS_TEST_DATABASE_URL;
  if (!url) return;
  const parsed = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(parsed.hostname) ||
    !parsed.pathname.startsWith("/quills_")
  )
    throw new Error("Use a disposable local quills_ database");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: resolve("drizzle") });
  } finally {
    await pool.end();
  }
  await runQuillsMigrations(url, resolve("drizzle/quills"));

  // Start every run from fresh copies: drop the worker databases of an earlier run.
  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  const admin = new Client({ connectionString: maintenance.toString() });
  await admin.connect();
  try {
    const { rows } = await admin.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE datname LIKE $1",
      [`${parsed.pathname.slice(1)}\\_w%`],
    );
    for (const { datname } of rows)
      await admin.query(`DROP DATABASE "${datname}" WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}
