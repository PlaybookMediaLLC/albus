// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import type { LanguageModelMiddleware } from "ai";

/** A call without its own limit may use this many output tokens. */
export const DEFAULT_OUTPUT_TOKENS = 1024;
/**
 * No call may use more output tokens than this, whatever it asks for. The long translations ask
 * for 8,000 (content.ts, portal/translations.ts), so the ceiling sits just above them.
 */
export const MAX_OUTPUT_TOKENS = 8192;

/** The output-token backstop: a default for every call and a ceiling no call can pass. */
export const outputBackstop: LanguageModelMiddleware = {
  transformParams: async ({ params }) => ({
    ...params,
    maxOutputTokens: Math.min(
      params.maxOutputTokens ?? DEFAULT_OUTPUT_TOKENS,
      MAX_OUTPUT_TOKENS,
    ),
  }),
};
