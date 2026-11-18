import { and, eq, isNull } from "drizzle-orm";
import {
  assistantDocuments,
  assistantSnippets,
} from "../../../database/quills/schema/assistant";
import { defineAiJob } from "../ai/job";
import { aiConfig } from "../provider";
import { embeddingSet } from "./content";

// Embeddings for the assistant's own knowledge, so a search finds a snippet or a document by
// meaning and not only by its words (retrieval.ts). A job on the store template (ai/job.ts): it
// reads the text, embeds it with no transaction open, and stores the vector only while the text
// is still the same, so a later edit is never overwritten with an older vector.

/**
 * assistant_snippet.created and .updated: embeds the snippet's title and content. An update that
 * kept the text (an enabled or audience change) keeps its embedding: the route clears it only
 * when the title or content changes.
 */
export const embedSnippet = defineAiJob({
  read: async (db, event) => {
    if (!aiConfig()?.embeddingModel) return null;
    const [row] = await db
      .select({
        id: assistantSnippets.id,
        title: assistantSnippets.title,
        content: assistantSnippets.content,
      })
      .from(assistantSnippets)
      .where(
        and(
          eq(assistantSnippets.id, event.entityId as never),
          isNull(assistantSnippets.embedding),
        ),
      );
    return row ?? null;
  },
  run: async (row, ai) =>
    (await ai.embed([`${row.title}\n${row.content}`], "snippet_embedding"))[0]!,
  write: async (db, row, vector) => {
    await db
      .update(assistantSnippets)
      .set(embeddingSet(vector))
      .where(
        and(
          eq(assistantSnippets.id, row.id),
          eq(assistantSnippets.title, row.title),
          eq(assistantSnippets.content, row.content),
        ),
      );
  },
});

/**
 * assistant_document.created: embeds the document's title and its first 8,000 characters.
 * ponytail: one vector for the start of a document; chunk long documents when retrieval needs it.
 */
export const embedDocument = defineAiJob({
  read: async (db, event) => {
    if (!aiConfig()?.embeddingModel) return null;
    const [row] = await db
      .select({
        id: assistantDocuments.id,
        title: assistantDocuments.title,
        content: assistantDocuments.content,
      })
      .from(assistantDocuments)
      .where(
        and(
          eq(assistantDocuments.id, event.entityId as never),
          isNull(assistantDocuments.deletedAt),
        ),
      );
    return row ?? null;
  },
  run: async (row, ai) =>
    (
      await ai.embed([`${row.title}\n${row.content}`], "document_embedding")
    )[0]!,
  write: async (db, row, vector) => {
    await db
      .update(assistantDocuments)
      .set(embeddingSet(vector))
      .where(
        and(
          eq(assistantDocuments.id, row.id),
          isNull(assistantDocuments.deletedAt),
        ),
      );
  },
});
