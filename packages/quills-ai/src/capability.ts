import type { z } from "zod";

/** Marks untrusted text inside a prompt. The API passes its own `untrusted` helper. */
export type Wrap = (label: string, text: string) => string;
/** The whole request of one capability: one system message and one user message. */
export type CapabilityPrompt = { system: string; user: string };
/**
 * The model role. `fast` classifies, extracts and judges; `deep` answers and writes. The API maps a
 * role to a model (QUILLS_AI_MODEL, or QUILLS_AI_MODEL_FAST and QUILLS_AI_MODEL_DEEP).
 */
export type ModelRole = "fast" | "deep";

/**
 * One AI capability as data: the request, the model role, the answer's shape and the usage step it
 * logs. It does no IO: the API runs it with the AI SDK (apps/api/src/quills/assistant/ai/run.ts).
 */
export type Capability<Input, Output> = {
  /** A stable name, for example `teach.extract`. */
  id: string;
  role: ModelRole;
  /** The ai_usage_log pipeline step, at most 30 characters. */
  step: string;
  /** The answer. A transform may cut text to the stored limits instead of failing the call. */
  schema: z.ZodType<Output>;
  /** The most output tokens the answer may use. Without it the API's backstop applies. */
  maxOutputTokens?: number;
  prompt: (input: Input, wrap: Wrap) => CapabilityPrompt;
};

/** Declares a capability with its types inferred from the definition. */
export const defineCapability = <Input, Output>(
  capability: Capability<Input, Output>,
) => capability;
