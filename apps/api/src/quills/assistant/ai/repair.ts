// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.

/**
 * The JSON object in a model's text, or null. It removes a Markdown fence, text around the object
 * and trailing commas, which cheap and local models often add. It never invents a value.
 */
export function repairJson(text: string): string | null {
  const unfenced = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const candidate = unfenced
    .slice(start, end + 1)
    .replace(/,(\s*[}\]])/g, "$1");
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}
