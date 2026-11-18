// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.

export type Usage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
};
/** Text and image parts of a user message, for a model that reads images. */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };
/** A chat message in the OpenAI shape that Quills code writes. Tool turns run in agent.ts. */
export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string };
