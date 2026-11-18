import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_OUTPUT_TOKENS,
  MAX_OUTPUT_TOKENS,
  outputBackstop,
} from "./middleware";

const limit = async (maxOutputTokens?: number) =>
  (
    await outputBackstop.transformParams!({
      type: "generate",
      params: { prompt: [], maxOutputTokens } as never,
      model: {} as never,
    })
  ).maxOutputTokens;

describe("outputBackstop", () => {
  it("gives a call without a limit the default, and caps every call", async () => {
    expect(await limit()).toBe(DEFAULT_OUTPUT_TOKENS);
    expect(await limit(300)).toBe(300);
    expect(await limit(100_000)).toBe(MAX_OUTPUT_TOKENS);
  });
});
