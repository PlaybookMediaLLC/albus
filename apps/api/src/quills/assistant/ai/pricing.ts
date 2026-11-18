// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { z } from "../../../openapi";
import type { Usage } from "./types";

// Cost tracking. QUILLS_AI_PRICES maps a model to its price in US dollars per million tokens, for
// example {"google/gemini-2.5-flash-lite": {"input": 0.1, "output": 0.4}}. A model without a price,
// such as a local one, costs nothing that Quills can know, so its usage rows have no cost.

const prices = z.record(
  z.string(),
  z.object({ input: z.number().min(0), output: z.number().min(0) }),
);

/** The configured prices. Read on each call, like the rest of the AI configuration. */
export function priceTable(): z.infer<typeof prices> {
  try {
    return prices.parse(JSON.parse(process.env.QUILLS_AI_PRICES || "{}"));
  } catch {
    return {};
  }
}

/** The cost of one call in US dollars with six decimals, or null without a price. */
export function costOf(usage: Usage | undefined): string | null {
  const price = usage && priceTable()[usage.model];
  if (!usage || !price) return null;
  return (
    (usage.inputTokens * price.input + usage.outputTokens * price.output) /
    1_000_000
  ).toFixed(6);
}
