import { and, desc, eq, sql } from "drizzle-orm";
import { assistantInvolvements } from "../../database/quills/schema/assistant";
import {
  conversationMessages,
  conversations,
} from "../../database/quills/schema/conversation";
import type { harness } from "../jobs/handlers/harness.fixture";
import { customer } from "../support/conversation-seed.fixture";

export type Turn = {
  from: "customer" | "teammate" | "assistant";
  text: string;
  /** A private team note. */
  internal?: boolean;
};

/**
 * A widget conversation in workspace A with the given turns, one second apart so their order is
 * stable. The teammate is the workspace owner; the assistant has no principal.
 */
export async function thread(
  h: ReturnType<typeof harness>,
  turns: Turn[],
  status: "open" | "closed" = "open",
) {
  return h.as(h.a, h.owner, async (db, actor) => {
    const visitor = await customer(db, `${crypto.randomUUID()}@example.test`);
    const [row] = await db
      .insert(conversations)
      .values({
        visitorPrincipalId: visitor as never,
        channel: "messenger",
        subject: "Eval conversation",
        status,
      })
      .returning({ id: conversations.id });
    const start = Date.now() - turns.length * 1000;
    const ids = await db
      .insert(conversationMessages)
      .values(
        turns.map((turn, index) => ({
          conversationId: row!.id,
          principalId: (turn.from === "customer"
            ? visitor
            : turn.from === "teammate"
              ? actor.principalId
              : null) as never,
          senderType:
            turn.from === "customer"
              ? ("visitor" as const)
              : ("agent" as const),
          content: turn.text,
          isInternal: turn.internal ?? false,
          createdAt: new Date(start + index * 1000),
        })),
      )
      .returning({ id: conversationMessages.id });
    const last = turns.map((turn) => turn.from).lastIndexOf("customer");
    return {
      conversationId: row!.id as string,
      lastCustomerMessageId: (last >= 0 ? ids[last]!.id : null) as
        | string
        | null,
    };
  });
}

/** What the customer agent did in a conversation: its reply, card, citations and handoff. */
export async function agentOutcome(
  h: ReturnType<typeof harness>,
  conversationId: string,
) {
  return h.system(h.a, async (db) => {
    const [reply] = await db
      .select({
        content: conversationMessages.content,
        citations: conversationMessages.citations,
        metadata: conversationMessages.metadata,
      })
      .from(conversationMessages)
      .where(
        and(
          eq(conversationMessages.conversationId, conversationId as never),
          sql`${conversationMessages.metadata}->>'assistantReply' = 'true'`,
        ),
      )
      .orderBy(desc(conversationMessages.createdAt))
      .limit(1);
    const [involvement] = await db
      .select({ handoff: assistantInvolvements.handoffReason })
      .from(assistantInvolvements)
      .where(eq(assistantInvolvements.conversationId, conversationId as never))
      .orderBy(desc(assistantInvolvements.createdAt))
      .limit(1);
    return {
      reply: reply?.content ?? "",
      citations: (reply?.citations ?? []).map((citation) => citation.id),
      card: reply?.metadata?.feedbackCard ?? null,
      handoff: involvement?.handoff ?? null,
    };
  });
}
