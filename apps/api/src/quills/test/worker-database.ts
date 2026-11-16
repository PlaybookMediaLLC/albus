import { Client } from "pg";

// Each Vitest worker uses its own copy of the migrated base database, so test files run in
// parallel without sharing rows or locks. The first test file in a worker makes the copy.
const base =
  process.env.QUILLS_TEST_BASE_DATABASE_URL ??
  process.env.QUILLS_TEST_DATABASE_URL;

if (base) {
  process.env.QUILLS_TEST_BASE_DATABASE_URL = base;
  const url = new URL(base);
  const template = url.pathname.slice(1);
  const name = `${template}_w${process.env.VITEST_POOL_ID ?? "1"}`;
  url.pathname = `/${name}`;
  if (process.env.QUILLS_TEST_DATABASE_URL !== url.toString()) {
    const maintenance = new URL(base);
    maintenance.pathname = "/postgres";
    const admin = new Client({ connectionString: maintenance.toString() });
    await admin.connect();
    try {
      const { rowCount } = await admin.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [name],
      );
      if (!rowCount)
        await admin.query(`CREATE DATABASE "${name}" TEMPLATE "${template}"`);
    } finally {
      await admin.end();
    }
    process.env.QUILLS_TEST_DATABASE_URL = url.toString();
  }
}
