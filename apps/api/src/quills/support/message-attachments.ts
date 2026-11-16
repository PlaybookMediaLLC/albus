// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { FileId } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { z } from "../../openapi";
import { conversationMessages } from "../../database/quills/schema/conversation";
import { files } from "../../database/quills/schema/files";
import type { Database, QuillsActor } from "../framework/define-route";
import type { MessageId } from "./message-model";

type Family = NonNullable<
  (typeof conversationMessages.$inferInsert)["attachments"]
>[number]["family"];

/** Files that a teammate reply or note carries: the caller's own registered uploads. */
export const attachmentIds = z
  .array(flexibleToTypeIdSchema("file"))
  .max(10)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate attachments")
  .default([]);

/**
 * Attaches the caller's unattached teammate uploads to a new message, in the message's
 * transaction. Another person's file, a customer upload, a removed file, a file of another
 * workspace or one already attached is 404, and nothing is attached.
 */
export async function attachMessageFiles(
  db: Database,
  actor: QuillsActor,
  messageId: MessageId,
  ids: readonly FileId[],
) {
  if (!ids.length) return;
  // Locked in ID order, so two requests with the same files cannot deadlock. Under read committed
  // a locked row is checked against the WHERE again, so a file that a concurrent request attached
  // drops out and counts as missing.
  const rows = await db
    .select({
      id: files.id,
      name: files.name,
      contentType: files.contentType,
      size: files.size,
      family: files.family,
    })
    .from(files)
    .where(
      and(
        inArray(files.id, [...ids]),
        eq(files.uploadedById, actor.principalId),
        eq(files.source, "agent"),
        isNull(files.attachedAt),
        isNull(files.deletedAt),
      ),
    )
    .orderBy(asc(files.id))
    .for("update");
  if (rows.length !== ids.length)
    throw new HTTPException(404, { message: "Attachment not found" });
  await db
    .update(files)
    .set({ messageId, attachedAt: new Date() })
    .where(inArray(files.id, [...ids]));
  const byId = new Map(rows.map((row) => [row.id, row]));
  await db
    .update(conversationMessages)
    .set({
      // In the order the caller sent. `url` is for refs written before the file pipeline.
      attachments: ids.map((id) => {
        const row = byId.get(id)!;
        return {
          url: "",
          fileId: row.id,
          name: row.name,
          contentType: row.contentType,
          size: row.size,
          family: row.family as Family,
        };
      }),
    })
    .where(eq(conversationMessages.id, messageId));
}
