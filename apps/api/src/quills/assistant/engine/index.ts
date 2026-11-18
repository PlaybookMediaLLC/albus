import {
  articlePublished,
  backfillEmbeddings,
  backfillTags,
  checkDuplicates,
  classifySentiment,
  summarizeConversation,
  summarizeTicket,
  translateRequested,
} from "./content";
import { extractSignals } from "../../jobs/handlers/signals";
import { runApprovedAction } from "./connector-calls";
import { answerRun } from "./runs";
import { answerCustomer } from "./customer-agent";
import { checkPostImages } from "./post-images";
import { titleUntitledPost } from "./post-title";
import type { Work, Write } from "./shared";
import { answerSlackHook } from "./slack";
import { draftKnowledgeSuggestion, reviewClosedConversation } from "./teach";
import { suggestFromDocument } from "./document-faq";
import { embedDocument, embedSnippet } from "./embed-knowledge";
import { fetchWebSource } from "./web-source";

export type { Work, Write } from "./shared";

/** Runs works in order for one event; their writes share the job's transaction. */
const all =
  (...works: Work[]): Work =>
  async (workspaceId, event) => {
    const writes: Write[] = [];
    for (const work of works) writes.push(await work(workspaceId, event));
    return async (db) => {
      for (const write of writes) await write(db);
    };
  };

/** Event type → the assistant work that the quills.ai queue runs for it after commit. */
export const assistantWork: Record<string, Work> = {
  "assistant_run.requested": answerRun,
  // Follow-up FU2: an approved connector action runs once here (connector-calls.ts).
  "assistant_action.approved": runApprovedAction,
  "assistant_web_source.added": fetchWebSource,
  // Only a refresh (payload `refresh`) fetches again; turning a source on or off does not.
  "assistant_web_source.updated": fetchWebSource,
  "assistant.embeddings_requested": backfillEmbeddings,
  "post.created": all(titleUntitledPost, checkPostImages, checkDuplicates),
  // Gap G-31: the customer agent answers a widget or portal conversation while it is on.
  "conversation.created": answerCustomer,
  "message.created": answerCustomer,
  "post.merge_check_requested": checkDuplicates,
  "post.sentiment_requested": classifySentiment,
  "post.tags_backfill_requested": backfillTags,
  "conversation.summary_requested": summarizeConversation,
  "ticket.summary_requested": summarizeTicket,
  "help_center.article_translation_requested": translateRequested,
  "help_center.article_published": articlePublished,
  // RFC 0001 lane G1: the Slack assistant's answer to a stored hook (slack.ts).
  "integration.hook_received": answerSlackHook,
  // RFC 0003 lane L1: feedback autopilot (jobs/handlers/signals.ts).
  // Issue #275 phase 3: a closed conversation also teaches the AI (teach.ts).
  "conversation.status_changed": all(extractSignals, reviewClosedConversation),
  "knowledge_suggestion.answered": draftKnowledgeSuggestion,
  // Search by meaning (retrieval.ts): each snippet and document gets an embedding.
  "assistant_snippet.created": embedSnippet,
  "assistant_snippet.updated": embedSnippet,
  // A new document is embedded, and its FAQ items become suggestions (document-faq.ts).
  "assistant_document.created": all(embedDocument, suggestFromDocument),
  "ticket.status_changed": extractSignals,
};
