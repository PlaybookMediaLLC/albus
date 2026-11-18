// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.

type Body = {
  choices?: {
    finish_reason?: string | null;
    message?: { tool_calls?: unknown[] };
  }[];
  data?: { index?: number }[];
};

/**
 * Evens out what OpenAI-compatible servers return, before the AI SDK reads it:
 * - a chat completion without `finish_reason` gets one from its message ("tool_calls" or "stop");
 *   without it the AI SDK runs no tool call and ends the loop;
 * - embeddings are put in `index` order; the AI SDK keeps array order, so a server that answers out
 *   of order would store vectors on the wrong texts.
 * Any other answer passes through unchanged.
 */
export async function normalizeResponse(
  url: string,
  response: Response,
): Promise<Response> {
  const chat = url.endsWith("/chat/completions");
  const embeddings = url.endsWith("/embeddings");
  if (!response.ok || (!chat && !embeddings)) return response;
  const text = await response.text();
  const rebuilt = (body: string) => {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
  let json: Body;
  try {
    json = JSON.parse(text);
  } catch {
    return rebuilt(text);
  }
  if (chat && Array.isArray(json?.choices))
    for (const choice of json.choices)
      choice.finish_reason ??= choice.message?.tool_calls?.length
        ? "tool_calls"
        : "stop";
  if (embeddings && Array.isArray(json?.data))
    json.data.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return rebuilt(JSON.stringify(json));
}
