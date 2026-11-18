/**
 * Turns selected examples into one text block that the caller puts at the start of its final user
 * message. It is not a message of its own: some chat templates of local OpenAI-compatible servers
 * reject two user messages in a row. Examples are never written as assistant turns either, because
 * customer text inside an assistant turn is harder to mark as data.
 *
 * The caller passes its own untrusted-text wrapper, so the escaping rule lives in one place (the
 * API's provider module).
 */
import type { Example, TaskKind } from "./types.js";

export const EXAMPLES_GUIDANCE: Record<TaskKind, string> = {
  duplicate:
    "Earlier team decisions on similar posts come first in the user message, as examples. When they conflict with your own reading, follow the team. Do not quote the examples in your reasoning.",
  tags: "Posts that this team tagged by hand come first in the user message, as examples. Choose only from the tag list above.",
};

const INTRO: Record<TaskKind, string> = {
  duplicate:
    'Earlier decisions by this team on similar post pairs. Use them to match the team\'s idea of "the same request".',
  tags: "Posts that this team tagged by hand. Use them to match the team's tagging habits.",
};

const answerLine = (example: Example) =>
  example.task === "duplicate"
    ? `Team decision: ${example.output.duplicate ? "duplicate" : "not duplicate"}`
    : `Team tags: ${example.output.tags.join(", ")}`;

/** The examples block, or null when there is no example (the caller then sends its prompt unchanged). */
export function renderExamples(
  task: TaskKind,
  examples: Example[],
  wrap: (label: string, text: string) => string,
): string | null {
  if (!examples.length) return null;
  const blocks = examples.map(
    (example, i) =>
      `${wrap(`example_${i + 1}`, example.input)}\n${answerLine(example)}`,
  );
  return [INTRO[task], ...blocks].join("\n\n");
}
