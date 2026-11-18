import { Pool } from "pg";

/** The eval's pool on this worker's database (set by worker-database.ts before this loads). */
const url = process.env.QUILLS_TEST_DATABASE_URL;
export const pool = url ? new Pool({ connectionString: url, max: 6 }) : null;
