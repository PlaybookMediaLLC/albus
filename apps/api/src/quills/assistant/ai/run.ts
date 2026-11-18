// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import type { Capability } from "@quills/ai/capability";
import { untrusted } from "../provider";
import { chatJson } from "./calls";
import type { UsageEntry } from "../runs";

/**
 * Runs one capability (a definition from @quills/ai) with the AI SDK: its role's model, its prompt
 * with untrusted text marked, its schema with output repair. Returns the answer and the usage row
 * to write in the job's own transaction.
 */
export async function runCapability<Input, Output>(
  capability: Capability<Input, Output>,
  input: Input,
) {
  const prompt = capability.prompt(input, untrusted);
  const { value, usage } = await chatJson(
    capability.schema,
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    capability.maxOutputTokens,
    capability.role,
  );
  const entry: UsageEntry = {
    step: capability.step,
    callType: "chat_completion",
    usage,
  };
  return { value, usage, entry };
}
