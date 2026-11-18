import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { costOf } from "./pricing";

const usage = {
  model: "cheap/model",
  inputTokens: 1_000_000,
  outputTokens: 500_000,
  totalTokens: 1_500_000,
  durationMs: 5,
};

describe("costOf", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prices a call from QUILLS_AI_PRICES in US dollars per million tokens", () => {
    vi.stubEnv(
      "QUILLS_AI_PRICES",
      JSON.stringify({ "cheap/model": { input: 0.1, output: 0.4 } }),
    );
    expect(costOf(usage)).toBe("0.300000");
  });

  it("has no cost without a price or with a broken setting", () => {
    vi.stubEnv(
      "QUILLS_AI_PRICES",
      JSON.stringify({ other: { input: 1, output: 1 } }),
    );
    expect(costOf(usage)).toBeNull();
    vi.stubEnv("QUILLS_AI_PRICES", "{not json");
    expect(costOf(usage)).toBeNull();
    expect(costOf(undefined)).toBeNull();
  });
});
