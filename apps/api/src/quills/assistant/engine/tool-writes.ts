import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { Database } from "../../../database/quills/client";
import { assistantToolCalls } from "../../../database/quills/schema/assistant-tool-calls";
import { principal } from "../../../database/quills/schema/auth";
import { recordQuillsChange } from "../../events";
import { memberQuillsActions } from "../../framework/platform-reads";
import { findConversation } from "../../support/conversation-model";
import type { WriteTool } from "../ai/tool";

export type AutoWrite = { tool: WriteTool; args: unknown };

/**
 * Runs a turn's `auto` write tools as the asking teammate, in the job's own transaction, so they
 * commit with the answer or not at all. The teammate's permission is checked again first: one who
 * lost the tool's action changes nothing. Each write runs in a savepoint: a domain refusal (a tag
 * that does not exist, a close without required attributes) marks that write failed and keeps the
 * answer. Each write gets its own tool-call record and event, as an approved pending action does
 * (assistant/pending-actions.ts).
 */
export async function applyAutoWrites(
  db: Database,
  input: {
    workspaceId: string;
    principalId: string;
    conversationId: string;
    writes: AutoWrite[];
  },
) {
  if (!input.writes.length) return;
  const [row] = await db
    .select({ userId: principal.kaneoUserId })
    .from(principal)
    .where(eq(principal.id, input.principalId as never));
  const actions = row?.userId
    ? await memberQuillsActions(input.workspaceId, row.userId)
    : [];
  const actor = {
    principalId: input.principalId as never,
    userId: row?.userId ?? "",
    workspaceId: input.workspaceId,
  };
  for (const { tool, args } of input.writes) {
    const started = Date.now();
    const parsed = tool.args.safeParse(args);
    const allowed = parsed.success && actions.includes(tool.action);
    let change = null;
    let refused = false;
    if (allowed)
      try {
        change = await db.transaction(async (savepoint) => {
          // A savepoint of the scoped transaction: same connection, same workspace scope.
          const scoped = savepoint as Database;
          return tool.execute(
            scoped,
            actor,
            await findConversation(scoped, input.conversationId as never, true),
            parsed.data,
          );
        });
      } catch (error) {
        if (!(error instanceof HTTPException)) throw error;
        refused = true;
      }
    if (change)
      await recordQuillsChange(db, { principalId: actor.principalId }, change);
    await db.insert(assistantToolCalls).values({
      conversationId: input.conversationId as never,
      toolName: tool.name,
      args: (parsed.success ? parsed.data : {}) as Record<string, unknown>,
      status: !allowed ? "denied" : refused ? "failed" : "succeeded",
      resultSummary: !allowed
        ? `Requires ${tool.action}`
        : refused
          ? "Could not apply"
          : change
            ? "Changed"
            : "No change needed",
      latencyMs: Date.now() - started,
      principalId: input.principalId as never,
    });
  }
}
