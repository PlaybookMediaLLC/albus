import { z } from "zod";
import { defineCapability } from "../capability.js";
import { EXAMPLES_GUIDANCE } from "./render.js";

// The duplicate check and the tag backfill. Examples (renderExamples) open the user message: some
// local chat templates reject two user turns in a row. Without examples, each request is the same
// as before examples existed.

/** A "duplicate" verdict at or above this confidence becomes a pending suggestion. */
export const DUPLICATE_CONFIDENCE = 0.7;

const withExamples = (examples: string | null, text: string) =>
  examples ? `${examples}\n\n${text}` : text;

const DUPLICATE_SYSTEM =
  'Decide whether two feedback posts ask for the same thing. Answer with one JSON object: {"duplicate": boolean, "confidence": number between 0 and 1, "reasoning": string}.';

/** Whether two feedback posts ask for the same thing. */
export const judgeDuplicate = defineCapability({
  id: "learning.duplicate",
  role: "fast",
  step: "merge_check",
  schema: z.object({
    duplicate: z.boolean(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().transform((text) => text.slice(0, 500)),
  }),
  prompt: (
    input: { first: string; second: string; examples: string | null },
    wrap,
  ) => ({
    system: input.examples
      ? `${DUPLICATE_SYSTEM}\n${EXAMPLES_GUIDANCE.duplicate}`
      : DUPLICATE_SYSTEM,
    user: withExamples(
      input.examples,
      `${wrap("first", input.first)}\n${wrap("second", input.second)}`,
    ),
  }),
});

/** Up to three existing tags for each post of a batch of at most 10. */
export const chooseTags = defineCapability({
  id: "learning.tags",
  role: "fast",
  step: "tag_backfill",
  maxOutputTokens: 1500,
  schema: z.object({
    posts: z
      .array(
        z.object({
          postId: z.string(),
          tagIds: z.array(z.string()).transform((ids) => ids.slice(0, 3)),
        }),
      )
      .transform((posts) => posts.slice(0, 10)),
  }),
  prompt: (
    input: {
      tags: { id: string; name: string }[];
      /** One "id: text" entry per post, separated by blank lines. */
      posts: string;
      examples: string | null;
    },
    wrap,
  ) => ({
    system: [
      "Choose up to three existing tags for each feedback post, or none when no tag fits.",
      ...input.tags.map((tag) => `- ${tag.id}: ${tag.name}`),
      'Answer with one JSON object: {"posts": [{"postId": string, "tagIds": string[]}]}.',
      ...(input.examples ? [EXAMPLES_GUIDANCE.tags] : []),
    ].join("\n"),
    user: withExamples(input.examples, wrap("posts", input.posts)),
  }),
});
