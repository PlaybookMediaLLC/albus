// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { aiUsageLog } from "../../database/quills/schema/ai-usage-log";
import type { Database } from "../framework/define-route";
import type { Message } from "./provider";

// The workspace AI limit (issue #23): QUILLS_AI_MONTHLY_TOKEN_LIMIT tokens per workspace in each UTC
// calendar month, counted from ai_usage_log. Unset, empty or not a positive integer: no limit.
// A call first reserves the most it can cost, under a workspace lock, so parallel calls cannot pass
// the limit together. The handler swaps the reservation for the real usage row. The reservation of
// a request that failed stops counting after RESERVATION_MINUTES.

const RESERVED = "reserved";
// Well above the provider's 60-second timeout, so a reservation outlives its call.
const RESERVATION_MINUTES = 5;
// The chat format adds a few tokens per message; 8 is above what OpenAI-compatible APIs add.
const MESSAGE_OVERHEAD = 8;

/** The configured limit, or null. Read on each call, like the provider settings. */
export function monthlyTokenLimit() {
  const value = Number(process.env.QUILLS_AI_MONTHLY_TOKEN_LIMIT?.trim() || "");
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

// shortcut: above what current providers charge for one image (OpenAI, Anthropic and Gemini stay
// under 2,000 tokens); raise it if a provider bills an image higher.
const IMAGE_TOKENS = 5_000;

/**
 * The most a chat completion can cost. Byte-level tokenizers never make more tokens than the
 * text has UTF-8 bytes, so this bounds any prompt in any language.
 */
export const tokenCeiling = (messages: readonly Message[], maxTokens: number) =>
  messages.reduce(
    (sum, message) =>
      sum +
      MESSAGE_OVERHEAD +
      (Array.isArray(message.content)
        ? message.content.reduce(
            (bytes, part) =>
              bytes +
              (part.type === "text"
                ? Buffer.byteLength(part.text)
                : IMAGE_TOKENS),
            0,
          )
        : Buffer.byteLength(message.content ?? "")),
    maxTokens,
  );

/**
 * Reserves the call's ceiling in the scoped workspace, or 409 when it would pass this month's
 * limit. Null without a limit. Runs in `prepare`, so the reservation commits before the call.
 */
export async function reserveAiBudget(
  db: Database,
  step: string,
  ceiling: number,
): Promise<string | null> {
  const limit = monthlyTokenLimit();
  if (limit === null) return null;
  await db.execute(
    sql`select pg_advisory_xact_lock(hashtext('quills-ai-budget'), hashtext(current_setting('quills.workspace_id')))`,
  );
  const now = new Date();
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  await db
    .delete(aiUsageLog)
    .where(
      and(
        eq(aiUsageLog.status, RESERVED),
        lt(
          aiUsageLog.createdAt,
          new Date(now.getTime() - RESERVATION_MINUTES * 60_000),
        ),
      ),
    );
  const [row] = await db
    .select({
      used: sql<string>`coalesce(sum(${aiUsageLog.totalTokens}), 0)`,
    })
    .from(aiUsageLog)
    .where(gte(aiUsageLog.createdAt, month));
  if (Number(row?.used ?? 0) + ceiling > limit)
    throw new HTTPException(409, {
      message: "The workspace reached its monthly AI limit",
    });
  const [reserved] = await db
    .insert(aiUsageLog)
    .values({
      pipelineStep: step.slice(0, 30),
      callType: "chat_completion",
      model: "reserved",
      totalTokens: ceiling,
      durationMs: 0,
      status: RESERVED,
    })
    .returning({ id: aiUsageLog.id });
  return reserved!.id;
}

/** Drops a reservation; the handler logs the real usage in the same transaction. */
export async function releaseAiBudget(db: Database, id: string | null) {
  if (id)
    await db
      .delete(aiUsageLog)
      .where(
        and(eq(aiUsageLog.id, id as never), eq(aiUsageLog.status, RESERVED)),
      );
}
