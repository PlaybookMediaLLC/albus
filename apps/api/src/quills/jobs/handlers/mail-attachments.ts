import { and, asc, eq, isNull } from "drizzle-orm";
import {
  type EmailAttachment,
  MAX_EMAIL_ATTACHMENT_BYTES,
} from "@kaneo/email/quills";
import type { Database } from "../../../database/quills/client";
import { conversationMessages } from "../../../database/quills/schema/conversation";
import { files } from "../../../database/quills/schema/files";
import { isMissingObjectError } from "../../../storage/head-uploaded-object";
import { readObject } from "../../framework/files";

type MessageId = (typeof conversationMessages.$inferSelect)["id"];
type StoredFile = {
  storageKey: string;
  name: string;
  contentType: string;
  size: number;
};

/** The live files of a message, in upload order. Read in the mail job's transaction. */
export const messageFiles = (db: Database, messageId: MessageId) =>
  db
    .select({
      storageKey: files.storageKey,
      name: files.name,
      contentType: files.contentType,
      size: files.size,
    })
    .from(files)
    .where(and(eq(files.messageId, messageId), isNull(files.deletedAt)))
    .orderBy(asc(files.createdAt), asc(files.id));

/**
 * The bytes of the files that fit one mail, read in the mail content's `prepare` step: outside any
 * transaction and before the delivery claim. A file past the budget or gone from storage stays
 * out; the mail's link opens the thread with it. Another storage failure throws, so the job fails
 * and retries before anything is sent.
 */
export async function loadMailAttachments(
  stored: readonly StoredFile[],
  budget = MAX_EMAIL_ATTACHMENT_BYTES,
  read = readObject,
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];
  let left = budget;
  for (const file of stored) {
    if (file.size > left) continue;
    try {
      const content = await read(file.storageKey, left);
      left -= content.length;
      attachments.push({
        filename: file.name,
        contentType: file.contentType,
        content: new Uint8Array(content),
      });
    } catch (error) {
      if (!isMissingObjectError(error)) throw error;
    }
  }
  return attachments;
}
