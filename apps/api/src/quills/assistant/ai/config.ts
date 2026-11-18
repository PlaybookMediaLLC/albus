// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import type { ModelRole } from "@quills/ai/capability";

export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  /** The default chat model (QUILLS_AI_MODEL). */
  model: string;
  /** The chat model of each role: QUILLS_AI_MODEL_FAST and QUILLS_AI_MODEL_DEEP, else the default. */
  models: Record<ModelRole, string>;
  embeddingModel: string | null;
};
/** The configured provider, or null. Read on each call, so a restart is the only change needed. */
export function aiConfig(): AiConfig | null {
  const baseUrl = process.env.QUILLS_AI_BASE_URL?.trim();
  const model = process.env.QUILLS_AI_MODEL?.trim();
  if (!baseUrl || !model) return null;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey: process.env.QUILLS_AI_API_KEY?.trim() ?? "",
    model,
    models: {
      fast: process.env.QUILLS_AI_MODEL_FAST?.trim() || model,
      deep: process.env.QUILLS_AI_MODEL_DEEP?.trim() || model,
    },
    embeddingModel: process.env.QUILLS_AI_EMBEDDING_MODEL?.trim() || null,
  };
}
