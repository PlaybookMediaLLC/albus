/**
 * The conversation text the teach loop may learn from: customer messages for context and teammate
 * replies for facts. AI replies, system messages and internal notes never reach the prompt, so the
 * assistant cannot learn from itself and private notes stay private. Each message is cut, redacted
 * and cut again (redaction on a short text stays cheap). The whole text is capped from the end: the
 * teammate's answer usually comes late in a long thread.
 */
import { clip } from "../learning/text.js";
import { redact } from "./redact.js";
import type { TranscriptMessage } from "./types.js";

const PER_MESSAGE = 1000;
const TOTAL = 8000;
const LABEL = { customer: "Customer", teammate: "Teammate" } as const;

export function sourceTranscript(messages: TranscriptMessage[]): {
  text: string;
  hasTeammateReply: boolean;
} {
  const lines: string[] = [];
  let length = 0;
  let hasTeammateReply = false;
  for (const message of [...messages].reverse()) {
    if (message.internal) continue;
    if (message.author !== "customer" && message.author !== "teammate")
      continue;
    const text = clip(
      redact(message.text.slice(0, PER_MESSAGE + 200)),
      PER_MESSAGE,
    );
    if (!text) continue;
    const line = `${LABEL[message.author]}: ${text}`;
    if (length + line.length > TOTAL) break;
    lines.unshift(line);
    length += line.length + 1;
    if (message.author === "teammate") hasTeammateReply = true;
  }
  return { text: lines.join("\n"), hasTeammateReply };
}
