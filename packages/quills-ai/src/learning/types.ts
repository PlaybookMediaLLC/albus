/**
 * Contracts of the learning module.
 *
 * An Example is one teammate decision, rendered as text that a prompt can show. The API turns rows
 * into Examples; the package never sees a table. Every query carries a scope (the workspace) and a
 * visibility value, and a store must honour both: an example from another workspace, or from a
 * board that the job may not read, is the worst failure this module can cause.
 */
import { z } from "zod";

export const TASK_KINDS = ["duplicate", "tags"] as const;
export const TaskKindSchema = z.enum(TASK_KINDS);
export type TaskKind = z.infer<typeof TaskKindSchema>;

const common = {
  /** Stable key for de-duplication: a suggestion id or a post id. */
  key: z.string().min(1),
  /** The text the model sees. Customer text: callers always wrap it as untrusted. */
  input: z.string().min(1),
  /** Cosine similarity to the subject, 0..1. */
  similarity: z.number().min(0).max(1),
  /** When the teammate decided. Ranks examples of equal similarity. */
  decidedAt: z.coerce.date(),
};

export const ExampleSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("duplicate"),
    ...common,
    output: z.object({ duplicate: z.boolean() }),
  }),
  z.object({
    task: z.literal("tags"),
    ...common,
    output: z.object({
      tags: z.array(z.string().min(1).max(100)).min(1).max(10),
    }),
  }),
]);
export type Example = z.infer<typeof ExampleSchema>;

export const VisibilitySchema = z.object({
  /** Boards that the job may read besides the boards without project links. */
  boardIds: z.array(z.string().min(1)).max(50),
  /** Boards without project links: every teammate can see them. */
  includeUnlinkedBoards: z.boolean(),
});
export type Visibility = z.infer<typeof VisibilitySchema>;

export const ExampleQuerySchema = z.object({
  task: TaskKindSchema,
  /** Tenant scope. The store MUST filter on it. */
  scopeId: z.string().min(1),
  /**
   * The posts the caller works on now, at most 10 (one tag batch). A row's similarity is its
   * similarity to the closest subject, so one query serves a whole batch.
   */
  subjects: z
    .array(
      z.object({
        key: z.string().min(1),
        /** A fresh vector, or null to use the stored vector of `key`. */
        embedding: z.array(z.number()).nullable(),
      }),
    )
    .min(1)
    .max(10),
  /** The model of every subject's vector. Only rows of the same model come back. */
  embeddingModel: z.string().min(1),
  visibility: VisibilitySchema,
  excludeKeys: z.array(z.string()).max(100).default([]),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ExampleQuery = z.input<typeof ExampleQuerySchema>;
export type ParsedExampleQuery = z.output<typeof ExampleQuerySchema>;

export const SelectOptionsSchema = z.object({
  k: z.number().int().min(0).max(10),
  minSimilarity: z.number().min(0).max(1).default(0.78),
  /** For a yes/no task: the most examples of one answer while the other answer has candidates. */
  maxSameAnswer: z.number().int().min(1).optional(),
  maxCharsPerExample: z.number().int().min(50).max(2000).default(500),
  maxCharsTotal: z.number().int().min(200).max(10000).default(3000),
  /** Share of the ranking score that comes from freshness; 0 ranks by similarity only. */
  freshnessWeight: z.number().min(0).max(1).default(0.2),
  /** Age in days at which a decision's freshness is one half. */
  freshnessHalfLifeDays: z.number().positive().default(90),
  /** The time that ages are measured from. Defaults to the call time; tests pass a fixed one. */
  now: z.coerce.date().optional(),
});
export type SelectOptions = z.input<typeof SelectOptionsSchema>;
