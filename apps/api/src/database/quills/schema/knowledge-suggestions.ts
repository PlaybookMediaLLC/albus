import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { OPEN_STATUSES, SUGGESTION_STATUSES } from "@quills/ai/teach";
import { typeIdColumnNullable } from "@kaneo/ids/drizzle";
import { quillsSchema, workspaceColumn, workspacePolicy } from "../tenancy";
import { assistantDocuments, assistantSnippets } from "./assistant";
import { principal } from "./auth";
import { conversations } from "./conversation";

/** pgvector column, 1536 dims, local to this file like the other schema files. */
const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(1536)";
  },
});

const openStatuses = sql.raw(
  OPEN_STATUSES.map((status) => `'${status}'`).join(", "),
);

/**
 * "Teach the AI" (issue #275, phase 3): knowledge that the AI found in a teammate's answer in a
 * closed conversation. It asks a teammate up to three questions, writes a draft, and a teammate
 * approves it into an assistant snippet or dismisses it. A dismissed topic is never suggested
 * again. `gap` marks a conversation the customer agent handed off because it could not answer;
 * those rank first. Derived data: not in transfers; it goes with its workspace.
 */
export const knowledgeSuggestions = quillsSchema
  .table(
    "ai_knowledge_suggestions",
    {
      workspaceId: workspaceColumn(),
      id: uuid("id").defaultRandom().notNull(),
      status: text("status", { enum: SUGGESTION_STATUSES })
        .notNull()
        .default("awaiting_answer"),
      gap: boolean("gap").notNull().default(false),
      topic: text("topic").notNull(),
      topicFingerprint: text("topic_fingerprint").notNull(),
      /** What the model first found; the questions and the draft start from it. */
      candidateTitle: text("candidate_title").notNull(),
      candidateContent: text("candidate_content").notNull(),
      /** The final draft, once the questions are done. */
      title: text("title"),
      content: text("content"),
      /** The candidate text's vector, to match later candidates. */
      embedding: vector("embedding"),
      embeddingModel: text("embedding_model"),
      evidenceCount: integer("evidence_count").notNull().default(1),
      questionCount: integer("question_count").notNull().default(0),
      stepIndex: integer("step_index").notNull().default(0),
      approvedSnippetId: typeIdColumnNullable("assistant_snippet")(
        "approved_snippet_id",
      ),
      decidedById: typeIdColumnNullable("principal")("decided_by_id"),
      decidedAt: timestamp("decided_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      primaryKey({ columns: [t.workspaceId, t.id] }),
      // The review list: open ones, gaps first, then by evidence.
      index("ai_knowledge_suggestions_list_idx").on(
        t.workspaceId,
        t.status,
        t.gap,
        t.evidenceCount,
      ),
      // Two jobs cannot open the same topic twice.
      uniqueIndex("ai_knowledge_suggestions_open_topic_unique")
        .on(t.workspaceId, t.topicFingerprint)
        .where(sql`${t.status} IN (${openStatuses})`),
      index("ai_knowledge_suggestions_snippet_idx").on(t.approvedSnippetId),
      index("ai_knowledge_suggestions_decided_by_idx").on(t.decidedById),
      check(
        "ai_knowledge_suggestions_text_check",
        sql`char_length(${t.topic}) BETWEEN 1 AND 200 AND char_length(${t.candidateTitle}) BETWEEN 1 AND 120 AND char_length(${t.candidateContent}) BETWEEN 1 AND 2000 AND (${t.title} IS NULL OR char_length(${t.title}) BETWEEN 1 AND 120) AND (${t.content} IS NULL OR char_length(${t.content}) BETWEEN 1 AND 2000)`,
      ),
      check(
        "ai_knowledge_suggestions_steps_check",
        sql`${t.questionCount} BETWEEN 0 AND 3 AND ${t.stepIndex} BETWEEN 0 AND ${t.questionCount} AND ${t.evidenceCount} >= 1`,
      ),
      foreignKey({
        columns: [t.workspaceId, t.approvedSnippetId],
        foreignColumns: [assistantSnippets.workspaceId, assistantSnippets.id],
      }).onDelete("set null"),
      foreignKey({
        columns: [t.workspaceId, t.decidedById],
        foreignColumns: [principal.workspaceId, principal.id],
      }).onDelete("set null"),
      workspacePolicy(t.workspaceId),
    ],
  )
  .enableRLS();

/** The questions of a suggestion, in order, each with the teammate's answer or skip. */
export const knowledgeQuestions = quillsSchema
  .table(
    "ai_knowledge_questions",
    {
      workspaceId: workspaceColumn(),
      id: uuid("id").defaultRandom().notNull(),
      suggestionId: uuid("suggestion_id").notNull(),
      position: integer("position").notNull(),
      question: text("question").notNull(),
      suggestedAnswers: jsonb("suggested_answers")
        .$type<string[]>()
        .notNull()
        .default([]),
      answer: text("answer"),
      skipped: boolean("skipped").notNull().default(false),
      answeredById: typeIdColumnNullable("principal")("answered_by_id"),
      answeredAt: timestamp("answered_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      primaryKey({ columns: [t.workspaceId, t.id] }),
      uniqueIndex("ai_knowledge_questions_position_unique").on(
        t.workspaceId,
        t.suggestionId,
        t.position,
      ),
      index("ai_knowledge_questions_answered_by_idx").on(t.answeredById),
      check(
        "ai_knowledge_questions_text_check",
        sql`${t.position} BETWEEN 0 AND 2 AND char_length(${t.question}) BETWEEN 1 AND 300 AND (${t.answer} IS NULL OR char_length(${t.answer}) BETWEEN 1 AND 1000) AND NOT (${t.skipped} AND ${t.answer} IS NOT NULL)`,
      ),
      foreignKey({
        columns: [t.workspaceId, t.suggestionId],
        foreignColumns: [
          knowledgeSuggestions.workspaceId,
          knowledgeSuggestions.id,
        ],
      }).onDelete("cascade"),
      foreignKey({
        columns: [t.workspaceId, t.answeredById],
        foreignColumns: [principal.workspaceId, principal.id],
      }).onDelete("set null"),
      workspacePolicy(t.workspaceId),
    ],
  )
  .enableRLS();

export const KNOWLEDGE_SOURCE_OUTCOMES = [
  "created",
  "attached",
  "discarded",
  "none",
] as const;

/**
 * One row per reviewed closed conversation: the evidence of a suggestion, or the memory that a
 * conversation gave nothing (or matched a dismissed topic). The unique conversation key makes the
 * review run once per conversation. A knowledge document's FAQ items (engine/document-faq.ts) are
 * evidence too: one row per item, or one `none` row, with `document_id` in place of the
 * conversation. Exactly one of the two is set.
 * ponytail: a conversation that reopens and closes again is not reviewed again.
 */
export const knowledgeSources = quillsSchema
  .table(
    "ai_knowledge_sources",
    {
      workspaceId: workspaceColumn(),
      id: uuid("id").defaultRandom().notNull(),
      conversationId: typeIdColumnNullable("conversation")("conversation_id"),
      documentId: typeIdColumnNullable("assistant_document")("document_id"),
      suggestionId: uuid("suggestion_id"),
      outcome: text("outcome", { enum: KNOWLEDGE_SOURCE_OUTCOMES }).notNull(),
      gap: boolean("gap").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      primaryKey({ columns: [t.workspaceId, t.id] }),
      uniqueIndex("ai_knowledge_sources_conversation_unique").on(
        t.workspaceId,
        t.conversationId,
      ),
      index("ai_knowledge_sources_suggestion_idx").on(t.suggestionId),
      index("ai_knowledge_sources_document_idx").on(t.documentId),
      check(
        "ai_knowledge_sources_origin_check",
        sql`num_nonnulls(${t.conversationId}, ${t.documentId}) = 1`,
      ),
      foreignKey({
        columns: [t.workspaceId, t.conversationId],
        foreignColumns: [conversations.workspaceId, conversations.id],
      }).onDelete("cascade"),
      foreignKey({
        columns: [t.workspaceId, t.documentId],
        foreignColumns: [assistantDocuments.workspaceId, assistantDocuments.id],
      }).onDelete("cascade"),
      foreignKey({
        columns: [t.workspaceId, t.suggestionId],
        foreignColumns: [
          knowledgeSuggestions.workspaceId,
          knowledgeSuggestions.id,
        ],
      }).onDelete("set null"),
      workspacePolicy(t.workspaceId),
    ],
  )
  .enableRLS();
