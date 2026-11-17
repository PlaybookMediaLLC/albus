import { eq } from "drizzle-orm";
import { directionOf } from "@kaneo/email/quills";
import type { PrincipalId } from "@kaneo/ids";
import type { Database } from "../../../database/quills/client";
import {
  principal,
  user as customer,
} from "../../../database/quills/schema/auth";
import { language } from "../../portal/translations";

/**
 * A customer recipient's saved language (`preferred_language`, set in the portal) as a language
 * subtag, or null. Teammates and customers without one get the default text (issues #76, #117).
 */
export async function recipientLanguage(
  db: Database,
  principalId: PrincipalId,
): Promise<string | null> {
  const [row] = await db
    .select({ tag: customer.preferredLanguage })
    .from(principal)
    .innerJoin(customer, eq(customer.id, principal.userId))
    .where(eq(principal.id, principalId));
  return row?.tag ? language(row.tag) : null;
}

/** The text direction of a recipient's mail: "rtl" for a saved right-to-left language (issue #117). */
export const recipientDirection = async (
  db: Database,
  principalId: PrincipalId,
) => directionOf((await recipientLanguage(db, principalId)) ?? "en");
