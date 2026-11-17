import { and, desc, eq, gt, isNotNull, ne } from "drizzle-orm";
import db, { schema } from "../database";

/**
 * Gives the desktop session the identity provider's session id (`oidcSid`) of the person's newest
 * live single sign-on session. A back-channel logout ends sessions by that id, so it also ends the
 * desktop session. ponytail: the newest single sign-on session stands for the browser that
 * approved the device code, because Better Auth does not record which session approved it.
 */
export async function inheritSsoSessionId(sessionId: string, userId: string) {
  const [sso] = await db
    .select({ oidcSid: schema.sessionTable.oidcSid })
    .from(schema.sessionTable)
    .where(
      and(
        eq(schema.sessionTable.userId, userId),
        isNotNull(schema.sessionTable.oidcSid),
        ne(schema.sessionTable.id, sessionId),
        // Better Auth deletes an expired row only when something reads it.
        gt(schema.sessionTable.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(schema.sessionTable.createdAt))
    .limit(1);
  if (sso?.oidcSid)
    await db
      .update(schema.sessionTable)
      .set({ oidcSid: sso.oidcSid })
      .where(eq(schema.sessionTable.id, sessionId));
}
