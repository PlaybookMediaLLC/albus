import { createHmac } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { kvStore } from "../../database/quills/schema/kv";
import type { Database } from "../../database/quills/client";

// IP blocks (gap G-28) are kv_store rows keyed by a keyed hash of the address, so the address
// itself is never stored. support/ip-blocks.ts writes them; customer writes check them here.

/** A keyed hash of a client address: it matches the same address, and cannot be read back. */
export const addressHash = (ip: string) =>
  createHmac("sha256", process.env.AUTH_SECRET || "quills-ip-block")
    .update(ip)
    .digest("hex")
    .slice(0, 40);

export const blockKey = (hash: string) => `ip_block:${hash}`;

/** The live kv_store row with this key. */
export const liveKey = (key: string) =>
  and(
    eq(kvStore.workspaceKey, "_"),
    eq(kvStore.key, key),
    gt(kvStore.expiresAt, sql`now()`),
  );

/** Whether a client address has a live block. */
export async function addressBlocked(db: Database, ip: string | null) {
  if (!ip) return false;
  const [row] = await db
    .select({ key: kvStore.key })
    .from(kvStore)
    .where(liveKey(blockKey(addressHash(ip))))
    .limit(1);
  return Boolean(row);
}
