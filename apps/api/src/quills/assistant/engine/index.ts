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
import { titleUntitledPost } from "./post-title";
import type { Work, Write } from "./shared";
import { answerSlackHook } from "./slack";
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
  "assistant.embeddings_requested": backfillEmbeddings,
  "post.created": all(titleUntitledPost, checkDuplicates),
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
  "conversation.status_changed": extractSignals,
  "ticket.status_changed": extractSignals,
};
