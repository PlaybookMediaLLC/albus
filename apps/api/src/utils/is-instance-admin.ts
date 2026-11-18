import { eq } from "drizzle-orm";
import type { Context } from "hono";
import db from "../database";
import { userTable } from "../database/schema";
import { hasInstanceAdminRole } from "./instance-admin-role";

export { hasInstanceAdminRole };

// The session user is loaded per request, so its role is current. Undefined
// means no session user (API keys), and the role must be read.
export function contextUserRole(c: Context): string | null | undefined {
  const user = c.get("user") as { role?: string | null } | null | undefined;
  return user && "role" in user ? (user.role ?? null) : undefined;
}

export async function isInstanceAdmin(c: Context): Promise<boolean> {
  const role = contextUserRole(c);
  if (role !== undefined) {
    return hasInstanceAdminRole(role);
  }

  const userId = c.get("userId");
  if (!userId) return false;

  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  return hasInstanceAdminRole(row?.role);
}
