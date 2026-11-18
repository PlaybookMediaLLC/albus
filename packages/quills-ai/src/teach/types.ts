/**
 * Contracts of the teach module: the loop that turns teammate answers in closed conversations into
 * knowledge snippets. The API owns the tables, the routes and the provider; the package holds the
 * rules, the prompt text and the answer schemas, so they are testable without IO.
 */
import { z } from "zod";

/** Who wrote a conversation message, as the API maps its rows. */
export const AUTHORS = ["customer", "teammate", "assistant", "system"] as const;
export type Author = (typeof AUTHORS)[number];
export type TranscriptMessage = {
  author: Author;
  /** A teammate-only note. It never reaches a prompt. */
  internal: boolean;
  text: string;
};

/** The lifecycle of a suggestion. Open states come first. */
export const SUGGESTION_STATUSES = [
  "awaiting_answer",
  "drafting",
  "draft_ready",
  "approved",
  "dismissed",
] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];
export const OPEN_STATUSES = [
  "awaiting_answer",
  "drafting",
  "draft_ready",
] as const satisfies readonly SuggestionStatus[];

/** At most this many questions before the draft (Cossistant's guided clarification). */
export const MAX_QUESTIONS = 3;

// A model's answer is cut to the stored limits instead of failing the whole review.
const cut = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((text) => text.slice(0, max));
const title = cut(120);
const content = cut(2000);

/** What the model found in a closed conversation, or null. */
export const CandidateAnswerSchema = z.object({
  knowledge: z.object({ topic: cut(200), title, content }).nullable(),
});
export type Candidate = NonNullable<
  z.infer<typeof CandidateAnswerSchema>["knowledge"]
>;

/** At most this many FAQ items from one knowledge document. */
export const MAX_DOCUMENT_ITEMS = 3;

/** The FAQ items a knowledge document answers, at most MAX_DOCUMENT_ITEMS. */
export const DocumentAnswerSchema = z.object({
  items: z
    .array(z.object({ topic: cut(200), title, content }))
    .transform((items) => items.slice(0, MAX_DOCUMENT_ITEMS)),
});

/** The questions for the teammate, at most MAX_QUESTIONS. */
export const QuestionsAnswerSchema = z.object({
  questions: z
    .array(
      z.object({
        question: cut(300),
        suggestedAnswers: z.array(z.string().trim()).transform((answers) =>
          answers
            .filter(Boolean)
            .map((answer) => answer.slice(0, 200))
            .slice(0, 4),
        ),
      }),
    )
    .transform((questions) => questions.slice(0, MAX_QUESTIONS)),
});
export type Question = z.infer<
  typeof QuestionsAnswerSchema
>["questions"][number];

/** The final draft. */
export const DraftAnswerSchema = z.object({ title, content });
export type Draft = z.infer<typeof DraftAnswerSchema>;

/** The same-item judge. */
export const SameAnswerSchema = z.object({ same: z.boolean() });
