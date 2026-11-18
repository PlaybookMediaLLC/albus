import { z } from "zod";
import { defineCapability } from "../capability.js";

/** TODO(quills-ai): say in one sentence what this capability decides or writes. */
export const {{camel}} = defineCapability({
  id: "{{name}}",
  role: "{{role}}",
  step: "{{step}}",
  // TODO(quills-ai): the answer's shape. Cut long text with a transform instead of rejecting it.
  schema: z.object({
    answer: z.string().transform((text) => text.slice(0, 500)),
  }),
  prompt: (input: { text: string }, wrap) => ({
    system: [
      "TODO(quills-ai): the task in plain words, with its limits.",
      'Answer with one JSON object: {"answer": string}.',
    ].join("\n"),
    // Customer or teammate text always goes through wrap: the model reads it as data.
    user: wrap("text", input.text),
  }),
});
