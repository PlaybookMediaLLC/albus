import { defineCapability } from "../capability.js";
import {
  documentPrompt,
  draftPrompt,
  extractPrompt,
  questionsPrompt,
  samePrompt,
  type AnsweredQuestion,
} from "./prompts.js";
import {
  CandidateAnswerSchema,
  DocumentAnswerSchema,
  DraftAnswerSchema,
  QuestionsAnswerSchema,
  SameAnswerSchema,
  type Candidate,
} from "./types.js";

/** The one durable fact in a closed conversation's transcript, or none. */
export const extractKnowledge = defineCapability({
  id: "teach.extract",
  role: "fast",
  step: "knowledge_review",
  schema: CandidateAnswerSchema,
  prompt: (transcript: string, wrap) => extractPrompt(transcript, wrap),
});

/** The FAQ items that a knowledge document answers (at most three), as draft snippets. */
export const extractDocumentFaqs = defineCapability({
  id: "teach.document",
  role: "fast",
  step: "knowledge_document",
  schema: DocumentAnswerSchema,
  maxOutputTokens: 2500,
  prompt: (document: string, wrap) => documentPrompt(document, wrap),
});

/** Up to three questions with suggested answers before the draft. */
export const askKnowledgeQuestions = defineCapability({
  id: "teach.questions",
  role: "fast",
  step: "knowledge_questions",
  schema: QuestionsAnswerSchema,
  prompt: (candidate: Candidate, wrap) => questionsPrompt(candidate, wrap),
});

/** Whether a new fact gives the same guidance as an existing suggestion or snippet. */
export const judgeSameKnowledge = defineCapability({
  id: "teach.same",
  role: "fast",
  step: "knowledge_match",
  schema: SameAnswerSchema,
  prompt: (
    input: {
      candidate: Pick<Candidate, "title" | "content">;
      existing: { title: string; content: string };
    },
    wrap,
  ) => samePrompt(input.candidate, input.existing, wrap),
});

/** The final snippet from the first draft and the teammate's answers. */
export const draftKnowledge = defineCapability({
  id: "teach.draft",
  role: "deep",
  step: "knowledge_draft",
  schema: DraftAnswerSchema,
  prompt: (
    input: { candidate: Candidate; answers: AnsweredQuestion[] },
    wrap,
  ) => draftPrompt(input.candidate, input.answers, wrap),
});
