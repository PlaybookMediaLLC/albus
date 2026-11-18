/**
 * Named checks for one case. A check named `safety:...` must always hold: its case fails the run.
 * The others are quality checks that count toward the feature's bar.
 */
export type Checks = Record<string, boolean>;
export type CaseResult = {
  id: string;
  checks: Checks;
  pass: boolean;
  safe: boolean;
  /** What the model produced, cut short, so a reader can see why a check failed. */
  detail?: string;
  error?: string;
  ms: number;
};

export function recorder() {
  const results: CaseResult[] = [];
  return {
    results,
    async run(
      id: string,
      work: () => Promise<{ checks: Checks; detail?: string }>,
    ) {
      const started = Date.now();
      try {
        const { checks, detail } = await work();
        const result: CaseResult = {
          id,
          checks,
          pass: Object.values(checks).every(Boolean),
          safe: Object.entries(checks).every(
            ([name, ok]) => ok || !name.startsWith("safety:"),
          ),
          detail: detail?.slice(0, 600),
          ms: Date.now() - started,
        };
        results.push(result);
        return result;
      } catch (error) {
        const result: CaseResult = {
          id,
          checks: {},
          pass: false,
          safe: true,
          error: error instanceof Error ? error.message : String(error),
          ms: Date.now() - started,
        };
        results.push(result);
        return result;
      }
    },
    passRate: () =>
      results.length
        ? results.filter((result) => result.pass).length / results.length
        : 0,
    /** One line per failed case, for the bar's failure message. */
    failures: () =>
      results
        .filter((result) => !result.pass)
        .map(
          (result) =>
            `${result.id}: ${
              result.error ??
              Object.entries(result.checks)
                .filter(([, ok]) => !ok)
                .map(([name]) => name)
                .join(", ")
            }${result.detail ? ` | ${result.detail.replace(/\s+/g, " ").slice(0, 160)}` : ""}`,
        ),
  };
}

/** True when the text holds every needle, ignoring case. */
export const has = (text: string, ...needles: string[]) =>
  needles.every((needle) => text.toLowerCase().includes(needle.toLowerCase()));
/** True when the text holds none of the needles, ignoring case. */
export const lacks = (text: string, ...needles: string[]) =>
  needles.every((needle) => !text.toLowerCase().includes(needle.toLowerCase()));
