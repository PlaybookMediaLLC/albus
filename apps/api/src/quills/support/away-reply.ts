import { and, eq, gt, sql } from "drizzle-orm";
import type { ConversationId } from "@kaneo/ids";
import { z } from "../../openapi";
import { conversationMessages } from "../../database/quills/schema/conversation";
import type { Database } from "../framework/define-route";
import { readSettingsKey } from "../feedback/settings-json";
import { systemNotice } from "./conversation-model";
import { teamPresence } from "./presence";

// The away reply (gap G-32): when a customer writes while no teammate is online, or outside office
// hours, the conversation gets one automatic answer. It repeats at most every 12 hours.

export const awayReplySchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().min(1).max(1000),
});
export const AWAY_REPLY_DEFAULT = {
  enabled: false,
  message:
    "Thanks for your message. The team is away right now and will reply as soon as they are back.",
};
const REPEAT_HOURS = 12;

/** The stored setting, or the default when unset or no longer valid. */
export async function readAwayReply(db: Database) {
  const parsed = awayReplySchema.safeParse(
    await readSettingsKey(db, "metadata", "awayReply"),
  );
  return parsed.success ? parsed.data : AWAY_REPLY_DEFAULT;
}

/** Posts the away reply after a customer message, when it is on and the team is away. */
export async function sendAwayReply(
  db: Database,
  conversationId: ConversationId,
) {
  const setting = await readAwayReply(db);
  if (!setting.enabled) return false;
  const team = await teamPresence(db);
  if (team.agentsOnline && team.withinOfficeHours) return false;
  const [recent] = await db
    .select({ id: conversationMessages.id })
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.conversationId, conversationId),
        sql`${conversationMessages.metadata}->'systemEvent'->>'kind' = 'away_reply'`,
        gt(
          conversationMessages.createdAt,
          sql`now() - make_interval(hours => ${REPEAT_HOURS})`,
        ),
      ),
    )
    .limit(1);
  if (recent) return false;
  await systemNotice(db, conversationId, setting.message, {
    event: { kind: "away_reply" },
  });
  return true;
}
