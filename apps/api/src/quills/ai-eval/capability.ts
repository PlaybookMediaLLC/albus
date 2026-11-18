import type { Capability } from "@quills/ai/capability";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { runCapability } from "../assistant/ai/run";
import { aiConfig } from "../assistant/provider";
import { recorder, type Checks } from "./score";
import { writeReport, type UsageRow } from "./suite";

/** One case of a capability eval: an input and the checks on the answer. */
export type CapabilityCase<Input, Output> = {
  id: string;
  input: Input;
  checks: (value: Output) => Checks;
  /** What to show when a check fails; the whole answer by default. */
  detail?: (value: Output) => string;
};

/**
 * The eval template for one capability: each case runs the capability as the API does (role,
 * prompt, schema, repair), with no database. Use evalSuite instead when the behavior depends on a
 * job, a route or stored data. The report goes where evalSuite's goes, so compare.ts counts it.
 */
export function capabilitySuite<Input, Output>(
  capability: Capability<Input, Output>,
  bar: number,
  cases: CapabilityCase<Input, Output>[],
) {
  const score = recorder();
  const usage = new Map<string, UsageRow>();
  const live = process.env.QUILLS_AI_EVAL === "1" && Boolean(aiConfig());
  describe.skipIf(!live)(`AI eval: ${capability.id}`, () => {
    afterAll(() => writeReport(capability.id, bar, score, [...usage.values()]));
    for (const item of cases)
      it(item.id, async () => {
        const result = await score.run(item.id, async () => {
          const { value, usage: used } = await runCapability(
            capability,
            item.input,
          );
          const row = usage.get(used.model) ?? {
            model: used.model,
            calls: 0,
            inputTokens: 0,
            outputTokens: 0,
          };
          usage.set(used.model, {
            ...row,
            calls: row.calls + 1,
            inputTokens: row.inputTokens + used.inputTokens,
            outputTokens: row.outputTokens + used.outputTokens,
          });
          return {
            checks: item.checks(value),
            detail: item.detail?.(value) ?? JSON.stringify(value),
          };
        });
        expect(result.safe, `${item.id}: ${result.detail ?? ""}`).toBe(true);
      });
    it(`meets the bar of ${Math.round(bar * 100)} %`, () => {
      expect(
        score.passRate(),
        score.failures().join("\n"),
      ).toBeGreaterThanOrEqual(bar);
    });
  });
}
