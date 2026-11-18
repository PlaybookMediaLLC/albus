// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import {
  APICallError,
  InvalidResponseDataError,
  JSONParseError,
  NoContentGeneratedError,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  RetryError,
  TypeValidationError,
} from "ai";

// A failure carries a fixed message and a code. The provider's text and the key never leave the
// AI layer: responses, logs and runs only ever see these messages.

const messages = {
  not_configured: "AI is not configured",
  embeddings_not_configured: "AI embeddings are not configured",
  timeout: "The AI provider did not answer in time. Try again.",
  rate_limited: "The AI provider is busy. Try again later.",
  rejected: "The AI provider rejected the request. Check the AI configuration.",
  unavailable: "The AI provider could not be reached. Try again.",
  bad_response: "The AI provider returned an answer that could not be used.",
} as const;
export type AiErrorCode = keyof typeof messages;
export class AiError extends Error {
  constructor(readonly code: AiErrorCode) {
    super(messages[code]);
  }
}

const timedOut = (error: unknown) =>
  ["TimeoutError", "AbortError"].includes((error as Error)?.name);

/**
 * The AiError for an AI SDK or network failure. Anything else is a bug in our code and is thrown
 * as it is, so the job fails loudly instead of reporting a provider problem.
 */
export function toAiError(error: unknown): unknown {
  if (error instanceof AiError) return error;
  if (timedOut(error)) return new AiError("timeout");
  if (RetryError.isInstance(error)) return toAiError(error.lastError);
  if (APICallError.isInstance(error)) {
    const status = error.statusCode;
    if (status === undefined)
      return new AiError(timedOut(error.cause) ? "timeout" : "unavailable");
    // A 200 whose body is not a completion (a gateway error page, for example).
    if (status < 300) return new AiError("bad_response");
    return new AiError(
      status === 429
        ? "rate_limited"
        : status === 408 || status >= 500
          ? "unavailable"
          : "rejected",
    );
  }
  if (
    NoObjectGeneratedError.isInstance(error) ||
    NoOutputGeneratedError.isInstance(error) ||
    NoContentGeneratedError.isInstance(error) ||
    JSONParseError.isInstance(error) ||
    TypeValidationError.isInstance(error) ||
    InvalidResponseDataError.isInstance(error)
  )
    return new AiError("bad_response");
  return error;
}
