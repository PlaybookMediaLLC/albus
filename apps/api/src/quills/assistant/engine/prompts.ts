import { EXAMPLES_GUIDANCE } from "@quills/ai/learning";
import { z } from "zod";
import { untrusted, type Message } from "../provider";

// The requests of the duplicate check and the tag backfill, in one module so the offline replay
// (apps/api/scripts/ai-learning-eval) measures exactly what ships. Examples open the final user
// message: some local chat templates reject two user turns in a row. Without examples, each request
// is the same as before examples existed.

export const DUPLICATE_SYSTEM =
  'Decide whether two feedback posts ask for the same thing. Answer with one JSON object: {"duplicate": boolean, "confidence": number between 0 and 1, "reasoning": string}.';

export const duplicateVerdict = z.object({
  duplicate: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(500),
});

/** A "duplicate" verdict at or above this confidence becomes a pending suggestion. */
export const DUPLICATE_CONFIDENCE = 0.7;

const withExamples = (examples: string | null, text: string) =>
  examples ? `${examples}\n\n${text}` : text;

export const duplicateMessages = (
  first: string,
  second: string,
  examples: string | null,
): Message[] => [
  {
    role: "system",
    content: examples
      ? `${DUPLICATE_SYSTEM}\n${EXAMPLES_GUIDANCE.duplicate}`
      : DUPLICATE_SYSTEM,
  },
  {
    role: "user",
    content: withExamples(
      examples,
      `${untrusted("first", first)}\n${untrusted("second", second)}`,
    ),
  },
];

export const tagAnswer = z.object({
  posts: z
    .array(
      z.object({
        postId: z.string(),
        tagIds: z.array(z.string()).max(3),
      }),
    )
    .max(10),
});

/** `posts` holds one "id: text" entry per post, separated by blank lines. */
export const tagMessages = (
  tags: { id: string; name: string }[],
  posts: string,
  examples: string | null,
): Message[] => [
  {
    role: "system",
    content: [
      "Choose up to three existing tags for each feedback post, or none when no tag fits.",
      ...tags.map((tag) => `- ${tag.id}: ${tag.name}`),
      'Answer with one JSON object: {"posts": [{"postId": string, "tagIds": string[]}]}.',
      ...(examples ? [EXAMPLES_GUIDANCE.tags] : []),
    ].join("\n"),
  },
  { role: "user", content: withExamples(examples, untrusted("posts", posts)) },
];
