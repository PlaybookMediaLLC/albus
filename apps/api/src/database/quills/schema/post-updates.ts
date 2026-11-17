import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { typeIdColumn, typeIdColumnNullable } from "@kaneo/ids/drizzle";
import { quillsSchema, workspaceColumn, workspacePolicy } from "../tenancy";
import { principal } from "./auth";
import { posts } from "./posts";

/**
 * One "send update" of a request (#92): the text, the channels and the customer targets, who sent it and
 * confirmed the release, and what it queued per channel. The mail worker reads the text from here at send
 * time. The idempotency key makes a repeated send return the first one.
 */
export const postUpdates = quillsSchema
  .table(
    "post_updates",
    {
      workspaceId: workspaceColumn(),
      id: uuid("id").defaultRandom().notNull(),
      postId: typeIdColumn("post")("post_id").notNull(),
      principalId: typeIdColumnNullable("principal")("principal_id"),
      body: text("body").notNull(),
      /** { page, email, conversations, slack }: the channels the sender chose. */
      channels: jsonb("channels").$type<Record<string, boolean>>().notNull(),
      segmentIds: jsonb("segment_ids").$type<string[]>().notNull().default([]),
      languages: jsonb("languages").$type<string[]>().notNull().default([]),
      /** The sender confirmed that the change shipped (no verified release record exists yet, #11). */
      releaseConfirmed: boolean("release_confirmed").notNull(),
      /** What the send counted per channel (see integrations/post-update.ts#updateCountsOf). */
      counts: jsonb("counts")
        .$type<Record<string, number | boolean>>()
        .notNull(),
      idempotencyKey: text("idempotency_key").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      primaryKey({ columns: [t.workspaceId, t.id] }),
      uniqueIndex("post_updates_idempotency_unique").on(
        t.workspaceId,
        t.idempotencyKey,
      ),
      index("post_updates_post_idx").on(t.postId, t.createdAt),
      // Deleting a principal sets these to null; the index keeps that from scanning the table.
      index("post_updates_principal_idx").on(t.principalId),
      check(
        "post_updates_body_length_check",
        sql`char_length(${t.body}) BETWEEN 1 AND 5000`,
      ),
      foreignKey({
        columns: [t.workspaceId, t.postId],
        foreignColumns: [posts.workspaceId, posts.id],
      }).onDelete("cascade"),
      foreignKey({
        columns: [t.workspaceId, t.principalId],
        foreignColumns: [principal.workspaceId, principal.id],
      }).onDelete("set null"),
      workspacePolicy(t.workspaceId),
    ],
  )
  .enableRLS();
