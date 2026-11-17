import { describe, expect, it } from "vite-plus/test";
import { searchTerms } from "./post-search";

describe("post search terms", () => {
  it("splits plain words from minus words, phrases included, lower-cased and unique", () => {
    expect(searchTerms('Export "dark Mode" -beta -"old board" export')).toEqual(
      {
        plain: ["export", "dark", "mode"],
        minus: ["beta", "old", "board"],
      },
    );
  });

  it("drops punctuation that could break a tsquery", () => {
    expect(searchTerms("csv:* & (pdf) | 'x'")).toEqual({
      plain: ["csv", "pdf", "x"],
      minus: [],
    });
  });
});
