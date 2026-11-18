/**
 * Prompt text of the teach loop, in our own words (the Chatwoot and Cossistant designs inspired the
 * rules; no text is copied). Each builder returns the system text and the user text; the caller
 * wraps customer and teammate text with its own untrusted-text wrapper, passed as `wrap`.
 */
import type { Candidate } from "./types.js";

type Wrap = (label: string, text: string) => string;
export type Prompt = { system: string; user: string };

export function extractPrompt(transcript: string, wrap: Wrap): Prompt {
  return {
    system: [
      "You read a closed support conversation between a customer and the support team.",
      "Find at most one fact or procedure that a teammate stated and that would help other customers too.",
      "Rules:",
      "- Use only facts that a teammate stated. Customer messages give context only.",
      "- Keep only durable, public rules or procedures.",
      '- Do not use account, order, payment, login or one-off answers, or answers such as "contact support" or "we will check".',
      "- Remove names, IDs, e-mail addresses, phone numbers and links.",
      "- Prefer no answer to a weak one.",
      'Answer with one JSON object: {"knowledge": {"topic": string, "title": string, "content": string} or null}. The topic is the customer question in one short sentence (at most 200 characters); the title has at most 120 characters and the content at most 2000.',
    ].join("\n"),
    user: wrap("conversation", transcript),
  };
}

/** A knowledge document's most useful customer questions, each with its answer from the text. */
export function documentPrompt(document: string, wrap: Wrap): Prompt {
  return {
    system: [
      "You read a knowledge document that the support team added for its assistant.",
      "Find at most three questions that customers are likely to ask and that the document answers.",
      "Rules:",
      "- Use only facts that the document states. Do not add or guess.",
      "- Keep durable, public rules or procedures; skip internal notes and one-off details.",
      "- Remove names, IDs, e-mail addresses, phone numbers and links.",
      "- Prefer fewer items to weak ones; an empty list is a good answer.",
      'Answer with one JSON object: {"items": [{"topic": string, "title": string, "content": string}]}. The topic is the customer question in one short sentence (at most 200 characters); the title has at most 120 characters and the content at most 2000.',
    ].join("\n"),
    user: wrap("document", document),
  };
}

const describe = (draft: Pick<Candidate, "topic" | "title" | "content">) =>
  `Topic: ${draft.topic}\nTitle: ${draft.title}\nContent: ${draft.content}`;

export function questionsPrompt(candidate: Candidate, wrap: Wrap): Prompt {
  return {
    system: [
      "A teammate will confirm a knowledge snippet for the support assistant. The draft below comes from a closed conversation.",
      "Ask at most three short questions that the teammate must answer so that the snippet is correct and complete, for example a missing condition, plan, time frame or exception.",
      "Give up to four short suggested answers for each question. A question has at most 300 characters and an answer at most 200.",
      "Ask no question when the draft is already complete.",
      'Answer with one JSON object: {"questions": [{"question": string, "suggestedAnswers": string[]}]}.',
    ].join("\n"),
    user: wrap("draft", describe(candidate)),
  };
}

export type AnsweredQuestion = { question: string; answer: string | null };

export function draftPrompt(
  candidate: Candidate,
  answers: AnsweredQuestion[],
  wrap: Wrap,
): Prompt {
  const qa = answers.length
    ? answers
        .map(
          (item, i) =>
            `${i + 1}. ${item.question}\nAnswer: ${item.answer ?? "(skipped)"}`,
        )
        .join("\n")
    : "(no questions)";
  return {
    system: [
      "Write the final knowledge snippet for the support assistant from the draft and the teammate's answers.",
      "Use only facts from the draft and the answers. A teammate's answer wins over the draft. A skipped question adds nothing.",
      "Keep it short and self-contained: a title of at most 120 characters and content of at most 2,000 characters.",
      "Remove names, IDs, e-mail addresses, phone numbers and links.",
      'Answer with one JSON object: {"title": string, "content": string}.',
    ].join("\n"),
    user: `${wrap("draft", describe(candidate))}\n${wrap("answers", qa)}`,
  };
}

export function samePrompt(
  candidate: Pick<Candidate, "title" | "content">,
  existing: { title: string; content: string },
  wrap: Wrap,
): Prompt {
  return {
    system: [
      "Decide whether two knowledge snippets give the same guidance.",
      "Answer true only when both answer the same question with the same guidance. A different condition, plan, audience, time frame or outcome makes them different. Related is not the same.",
      "When you are unsure, answer false.",
      'Answer with one JSON object: {"same": boolean}.',
    ].join("\n"),
    user: `${wrap("new", `${candidate.title}\n${candidate.content}`)}\n${wrap("existing", `${existing.title}\n${existing.content}`)}`,
  };
}

/** What the API embeds for a candidate or a suggestion, so both sides compare the same text. */
export const embeddingText = (item: { title: string; content: string }) =>
  `${item.title}\n${item.content}`;
