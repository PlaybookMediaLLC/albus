import type { TFunction } from "i18next";
import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import { validationMessage } from "./validation-message";

const t = ((key: string, values?: Record<string, unknown>) =>
  values ? `${key} ${JSON.stringify(values)}` : key) as unknown as TFunction;
const messageOf = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value, { error: (issue) => validationMessage(t, issue) })
    .error?.issues[0]?.message;

describe("validationMessage", () => {
  it("names a required, short, long or malformed text with a portal string", () => {
    expect(messageOf(z.string().min(1), "")).toBe("core.validation.required");
    expect(messageOf(z.string().min(2), "a")).toBe(
      'core.validation.tooShort {"min":2}',
    );
    expect(messageOf(z.string().max(3), "abcd")).toBe(
      'core.validation.tooLong {"max":3}',
    );
    expect(messageOf(z.string().regex(/^[a-z]+$/), "A1")).toBe(
      "core.validation.format",
    );
    expect(messageOf(z.number(), "x")).toBe("core.validation.invalid");
  });
  it("keeps a message that the schema sets itself", () => {
    expect(messageOf(z.string().min(1, "Own message"), "")).toBe("Own message");
  });
});
