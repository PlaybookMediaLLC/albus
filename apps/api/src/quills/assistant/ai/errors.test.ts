import { APICallError, NoObjectGeneratedError } from "ai";
import { describe, expect, it } from "vite-plus/test";
import { AiError, toAiError } from "./errors";

const apiError = (statusCode?: number, cause?: unknown) =>
  new APICallError({
    message: "provider text with a secret",
    url: "https://provider.example/v1/chat/completions",
    requestBodyValues: {},
    statusCode,
    cause,
  });
const code = (error: unknown) => (toAiError(error) as AiError).code;

describe("toAiError", () => {
  it("maps provider answers to fixed codes", () => {
    expect(code(apiError(429))).toBe("rate_limited");
    expect(code(apiError(503))).toBe("unavailable");
    expect(code(apiError(408))).toBe("unavailable");
    expect(code(apiError(401))).toBe("rejected");
    expect(code(apiError(undefined))).toBe("unavailable");
    expect(
      code(apiError(undefined, new DOMException("t", "TimeoutError"))),
    ).toBe("timeout");
    expect(code(new DOMException("t", "TimeoutError"))).toBe("timeout");
  });

  it("calls an unusable answer a bad response, and never repeats provider text", () => {
    const error = new NoObjectGeneratedError({
      message: "provider text",
      text: "{",
      response: { id: "r", timestamp: new Date(), modelId: "m" },
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } as never,
      finishReason: "stop",
    });
    const mapped = toAiError(error) as AiError;
    expect(mapped.code).toBe("bad_response");
    expect(mapped.message).not.toContain("provider text");
    expect((toAiError(apiError(500)) as AiError).message).not.toContain(
      "secret",
    );
  });

  it("throws our own bugs as they are", () => {
    const bug = new TypeError("x is undefined");
    expect(toAiError(bug)).toBe(bug);
  });
});
