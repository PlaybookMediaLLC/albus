import { and, eq, isNull } from "drizzle-orm";
import {
  extractDocumentFaqs,
  topicFingerprint,
  type Candidate,
} from "@quills/ai/teach";
import { withQuillsSystemWorkspace } from "../../../database/quills/client";
import { assistantDocuments } from "../../../database/quills/schema/assistant";
import { knowledgeSources } from "../../../database/quills/schema/knowledge-suggestions";
import { runCapability } from "../ai/run";
import { AiError, aiConfig } from "../provider";
import { logUsage, type UsageEntry } from "../runs";
import { nothing, type Work } from "./shared";
import { attach, inTime, matchCandidate, openSuggestion } from "./teach";

// FAQ suggestions from a knowledge document (Teach the AI, issue #275). When a document is added,
// the AI finds up to three customer questions that it answers. Each item goes through the same
// matching as a closed conversation's fact (teach.ts): a match with approved or dismissed
// knowledge is dropped, a match with an open suggestion adds evidence, and a new topic becomes a
// ready draft for a teammate to approve. A document states its answer, so no questions are asked.

/** The document text the model reads: its start, where the main answers usually are. */
const MAX_TEXT = 12_000;
/**
 * No provider call starts after this long. The document's embedding runs first in the same job
 * (one 60-second call at most), so a last 60-second call still ends inside the 300-second lease.
 */
const BUDGET_MS = 120_000;

/**
 * assistant_document.created: suggests FAQ snippets once per document (ai_knowledge_sources with
 * document_id). Best effort, like the conversation review: a provider failure or the time budget
 * skips it, so the document's embedding in the same job is kept. Calls that succeeded are logged.
 */
export const suggestFromDocument: Work = async (workspaceId, event) => {
  if (!aiConfig()) return nothing;
  const usage: UsageEntry[] = [];
  try {
    return await suggest(workspaceId, event, usage, Date.now() + BUDGET_MS);
  } catch (error) {
    if (!(error instanceof AiError)) throw error;
    return async (db) => logUsage(db, usage);
  }
};

const suggest = async (
  workspaceId: string,
  event: Parameters<Work>[1],
  usage: UsageEntry[],
  deadline: number,
): ReturnType<Work> => {
  const document = await withQuillsSystemWorkspace(workspaceId, async (db) => {
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
    if (!row) return null;
    const [seen] = await db
      .select({ id: knowledgeSources.id })
      .from(knowledgeSources)
      .where(eq(knowledgeSources.documentId, row.id))
      .limit(1);
    return seen ? null : row;
  });
  if (!document) return nothing;
  const source = (
    outcome: (typeof knowledgeSources.$inferInsert)["outcome"],
    suggestionId?: string,
  ): typeof knowledgeSources.$inferInsert => ({
    documentId: document.id,
    outcome,
    gap: false,
    suggestionId: suggestionId ?? null,
  });

  inTime(deadline);
  const extracted = await runCapability(
    extractDocumentFaqs,
    `${document.title}\n\n${document.content.slice(0, MAX_TEXT)}`,
  );
  usage.push(extracted.entry);
  // One item at a time: the deadline check runs before each call.
  const items: ({ candidate: Candidate } & Awaited<
    ReturnType<typeof matchCandidate>
  >)[] = [];
  const fingerprints = new Set<string>();
  for (const candidate of extracted.value.items) {
    // Two items on one topic would count the document twice as evidence.
    if (fingerprints.has(topicFingerprint(candidate.topic))) continue;
    fingerprints.add(topicFingerprint(candidate.topic));
    items.push({
      candidate,
      ...(await matchCandidate(workspaceId, candidate, usage, deadline)),
    });
  }

  return async (db) => {
    await logUsage(db, usage);
    // A second run (a retried or doubled job) writes nothing: the document row lock orders runs,
    // and the first run's evidence is visible to the second.
    await db
      .select({ id: assistantDocuments.id })
      .from(assistantDocuments)
      .where(eq(assistantDocuments.id, document.id))
      .for("update");
    const [seen] = await db
      .select({ id: knowledgeSources.id })
      .from(knowledgeSources)
      .where(eq(knowledgeSources.documentId, document.id))
      .limit(1);
    if (seen) return;
    // The memory that this document was read, even when it answers nothing.
    if (!items.length) await db.insert(knowledgeSources).values(source("none"));
    for (const { candidate, fingerprint, vector, route } of items) {
      if (route.action === "discard")
        await db.insert(knowledgeSources).values(source("discarded"));
      else if (route.action === "attach")
        await attach(
          db,
          route.suggestionId,
          source("attached", route.suggestionId),
          false,
        );
      else
        await openSuggestion(
          db,
          {
            status: "draft_ready",
            gap: false,
            candidate,
            fingerprint,
            vector,
            title: candidate.title,
            content: candidate.content,
            questionCount: 0,
          },
          source,
        );
    }
  };
};
