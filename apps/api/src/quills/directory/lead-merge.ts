import { eq, sql, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { toUuid } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { user } from "../../database/quills/schema/auth";
import { defineQuillsRoute } from "../framework/define-route";
import { loadCustomer, type Db } from "./customer";

/**
 * Tables whose principal column moves from the lead to the customer, in order.
 * `unique` lists the other columns of a unique key: a lead row that would collide
 * with a row the customer already has is dropped, and the customer's row wins.
 * Ported from Quackback's REPOINT_STEPS. A reference this list misses fails the
 * final delete (RESTRICT) and rolls the merge back.
 */
const steps: { table: string; column: string; unique?: string[] }[] = [
  { table: "slack_user_links", column: "principal_id" },
  { table: "post_votes", column: "principal_id", unique: ["post_id"] },
  {
    table: "post_comment_reactions",
    column: "principal_id",
    unique: ["comment_id", "emoji"],
  },
  { table: "in_app_notifications", column: "principal_id" },
  { table: "post_comments", column: "principal_id" },
  { table: "posts", column: "principal_id" },
  { table: "email_log", column: "principal_id" },
  { table: "post_edit_history", column: "editor_principal_id" },
  { table: "post_comment_edit_history", column: "editor_principal_id" },
  { table: "post_activity", column: "principal_id" },
  { table: "conversations", column: "visitor_principal_id" },
  { table: "conversation_messages", column: "principal_id" },
  { table: "files", column: "uploaded_by_id" },
  {
    table: "conversation_participants",
    column: "principal_id",
    unique: ["conversation_id"],
  },
  { table: "conversation_summaries", column: "visitor_principal_id" },
  { table: "workflow_runs", column: "subject_principal_id" },
  { table: "workflow_run_events", column: "subject_principal_id" },
  { table: "post_subscriptions", column: "principal_id", unique: ["post_id"] },
  { table: "page_views", column: "principal_id" },
  { table: "visitor_devices", column: "principal_id" },
  { table: "user_tag_assignments", column: "principal_id", unique: ["tag_id"] },
  {
    table: "kb_article_feedback",
    column: "principal_id",
    unique: ["article_id"],
  },
  {
    table: "channel_identities",
    column: "principal_id",
    unique: ["channel", "external_id"],
  },
  { table: "tickets", column: "requester_principal_id" },
  { table: "ticket_summaries", column: "requester_principal_id" },
  {
    table: "ticket_subscriptions",
    column: "principal_id",
    unique: ["ticket_id"],
  },
  { table: "ticket_activity", column: "principal_id" },
  { table: "changelog_subscriptions", column: "principal_id", unique: [] },
  { table: "status_subscriptions", column: "principal_id", unique: [] },
  // RFC 0003. These cascade on a principal delete, so a missed table would lose rows, not fail.
  { table: "feedback_signals", column: "principal_id" },
  {
    table: "survey_responses",
    column: "principal_id",
    unique: ["survey_id"],
  },
  {
    table: "changelog_reactions",
    column: "principal_id",
    unique: ["changelog_entry_id", "emoji"],
  },
  { table: "changelog_reads", column: "principal_id", unique: [] },
  // Issue #129: these cascade on a principal delete too. Unsubscribe links already mailed keep working.
  { table: "unsubscribe_tokens", column: "principal_id" },
  { table: "post_mentions", column: "principal_id", unique: ["post_id"] },
  {
    table: "conversation_message_mentions",
    column: "principal_id",
    unique: ["conversation_message_id"],
  },
  {
    table: "conversation_message_reactions",
    column: "principal_id",
    unique: ["conversation_message_id", "emoji"],
  },
];

/** A dropped duplicate leaves no count behind: each vote or rating row is counted once. */
const recount: Record<string, (drop: SQL) => SQL> = {
  post_votes: (drop) =>
    sql`WITH dropped AS (${drop} RETURNING s.post_id) UPDATE quills.posts p SET vote_count = greatest(0, p.vote_count - 1) FROM dropped WHERE p.id = dropped.post_id`,
  kb_article_feedback: (drop) =>
    sql`WITH dropped AS (${drop} RETURNING s.article_id, s.helpful) UPDATE quills.kb_articles a SET helpful_count = greatest(0, a.helpful_count - d.helpful::int), not_helpful_count = greatest(0, a.not_helpful_count - (NOT d.helpful)::int) FROM dropped d WHERE a.id = d.article_id`,
};

/** Profile fields on the customer that the lead fills only when the customer has none. */
const fillIfEmpty = [
  "contact_email",
  "company_id",
  "blocked_at",
  "blocked_by_principal_id",
];

/** Moves every activity row of `lead` to `target` (widget/anonymous-merge.ts reuses it). */
export async function repoint(db: Db, lead: string, target: string) {
  const from = toUuid(lead),
    to = toUuid(target);
  for (const { table, column, unique } of steps) {
    const name = sql.raw(`quills."${table}"`),
      col = sql.raw(`"${column}"`);
    if (unique) {
      const same = unique.map((u) => sql.raw(` AND t."${u}" = s."${u}"`));
      const drop = sql`DELETE FROM ${name} s WHERE s.${col} = ${from}::uuid AND EXISTS (SELECT 1 FROM ${name} t WHERE t.${col} = ${to}::uuid${sql.join(same, sql``)})`;
      await db.execute(recount[table]?.(drop) ?? drop);
    }
    await db.execute(
      sql`UPDATE ${name} SET ${col} = ${to}::uuid WHERE ${col} = ${from}::uuid`,
    );
  }
  // One preferences row per person. An opt-out on either side wins, so mail never resumes for
  // someone who unsubscribed (the email channel of each matrix type too).
  await db.execute(
    sql`UPDATE quills.notification_preferences t SET email_muted = t.email_muted OR s.email_muted, email_status_change = t.email_status_change AND s.email_status_change, email_new_comment = t.email_new_comment AND s.email_new_comment, matrix = (SELECT jsonb_object_agg(k.key, coalesce(s.matrix -> k.key, '{}') || coalesce(t.matrix -> k.key, '{}') || CASE WHEN s.matrix -> k.key ->> 'email' = 'false' OR t.matrix -> k.key ->> 'email' = 'false' THEN '{"email": false}'::jsonb ELSE '{}'::jsonb END) FROM jsonb_object_keys(coalesce(s.matrix, '{}') || coalesce(t.matrix, '{}')) AS k(key)), updated_at = now() FROM quills.notification_preferences s WHERE t.principal_id = ${to}::uuid AND s.principal_id = ${from}::uuid`,
  );
  await db.execute(
    sql`DELETE FROM quills.notification_preferences s WHERE s.principal_id = ${from}::uuid AND EXISTS (SELECT 1 FROM quills.notification_preferences t WHERE t.principal_id = ${to}::uuid)`,
  );
  await db.execute(
    sql`UPDATE quills.notification_preferences SET principal_id = ${to}::uuid WHERE principal_id = ${from}::uuid`,
  );
  // Explicit segment memberships follow the person; dynamic ones are rebuilt by evaluation.
  await db.execute(
    sql`DELETE FROM quills.user_segments s WHERE s.principal_id = ${from}::uuid AND (s.added_by = 'dynamic' OR EXISTS (SELECT 1 FROM quills.user_segments t WHERE t.principal_id = ${to}::uuid AND t.segment_id = s.segment_id))`,
  );
  await db.execute(
    sql`UPDATE quills.user_segments SET principal_id = ${to}::uuid WHERE principal_id = ${from}::uuid`,
  );
  for (const column of fillIfEmpty) {
    const col = sql.raw(`"${column}"`);
    await db.execute(
      sql`UPDATE quills.principal SET ${col} = (SELECT source.${col} FROM quills.principal source WHERE source.id = ${from}::uuid) WHERE id = ${to}::uuid AND ${col} IS NULL`,
    );
  }
}

const mergeLead = defineQuillsRoute({
  method: "post",
  path: "/users/{principalId}/merge",
  operationId: "mergeQuillsLeadIntoUser",
  summary: "Merge a lead into an identified customer",
  description:
    "Moves the lead's activity to the customer and removes the lead, in one transaction.",
  action: "update",
  params: z.object({ principalId: flexibleToTypeIdSchema("principal") }),
  body: z.object({ targetPrincipalId: flexibleToTypeIdSchema("principal") }),
  response: z.object({ principalId: z.string() }),
  responseDescription: "The customer that now holds the lead's activity",
  errors: { 404: "Lead or customer not found" },
  event: ({ params }, result) => ({
    type: "user.lead_merged",
    entityType: "principal",
    entityId: result.principalId,
    payload: { leadPrincipalId: params.principalId },
  }),
  handler: async ({ db, params, body }) => {
    if (params.principalId === body.targetPrincipalId)
      throw new HTTPException(404, {
        message: "A lead cannot be merged into itself",
      });
    const lead = await loadCustomer(db, params.principalId, true);
    const target = await loadCustomer(db, body.targetPrincipalId, true);
    if (lead.type !== "anonymous")
      throw new HTTPException(404, { message: "Lead not found" });
    if (target.type !== "user")
      throw new HTTPException(404, { message: "Customer not found" });
    await repoint(db, lead.principalId, target.principalId);
    // The profile delete cascades to the lead's principal.
    await db.delete(user).where(eq(user.id, lead.userId));
    return { principalId: target.principalId };
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>().openapi(
  ...mergeLead,
);
