// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ModelRole } from "@quills/ai/capability";
import { wrapLanguageModel } from "ai";
import type { AiConfig } from "./config";
import { normalizeResponse } from "./compat";
import { outputBackstop } from "./middleware";

// The only place that builds a model. Any OpenAI-compatible server works (OpenRouter, OpenAI, a
// local model), so self-hosting keeps one setting. Every chat model gets the middleware here, so no
// caller can skip it.

const provider = (config: AiConfig) =>
  createOpenAICompatible({
    name: "quills",
    baseURL: config.baseUrl,
    apiKey: config.apiKey || undefined,
    // Image links go to the provider as they are: the server never downloads a link for a model.
    supportedUrls: () => ({ "image/*": [/^https:\/\/.+$/] }),
    // No redirects: a request that carries the key never goes to another address.
    fetch: async (input, init) => {
      const response = await fetch(input, { ...init, redirect: "error" });
      return normalizeResponse(String(input), response);
    },
  });

/** The chat model of a role, wrapped with the middleware. */
export const languageModel = (config: AiConfig, role: ModelRole) =>
  wrapLanguageModel({
    model: provider(config).chatModel(config.models[role]),
    middleware: [outputBackstop],
  });

/** The embedding model. The caller checks that one is configured. */
export const embeddingModel = (config: AiConfig & { embeddingModel: string }) =>
  provider(config).textEmbeddingModel(config.embeddingModel);
