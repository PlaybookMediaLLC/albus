import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { drizzle } from "drizzle-orm/node-postgres";
import { vi } from "vite-plus/test";
import * as kaneo from "../../database/schema";
import { pool } from "./pool";

// Only the QUILLS_AI_* settings come from the root .env, and only when the shell did not set them,
// so the eval never picks up a database or another service from that file.
const file = fileURLToPath(new URL("../../../../../.env", import.meta.url));
if (existsSync(file))
  for (const [key, value] of Object.entries(
    parseEnv(readFileSync(file, "utf8")),
  ))
    if (key.startsWith("QUILLS_AI_") && process.env[key] === undefined)
      process.env[key] = value;

vi.mock("../../database/index", () => ({
  getDatabasePool: () => pool,
  get schema() {
    return kaneo;
  },
  default: new Proxy(
    {},
    {
      get(_target, property) {
        const db = drizzle(pool!, { schema: kaneo });
        const value = Reflect.get(db, property);
        return typeof value === "function" ? value.bind(db) : value;
      },
    },
  ),
}));
vi.mock("../../ws", () => ({ broadcastToUserAndWait: vi.fn(async () => {}) }));
