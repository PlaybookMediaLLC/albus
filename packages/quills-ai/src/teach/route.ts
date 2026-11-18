/**
 * Where a new candidate goes, after Chatwoot Captain's observation routing. The API finds the
 * closest items (embeddings first, then the same-item judge) and passes the first match here.
 * - It matches an approved snippet or a dismissed suggestion: discard it, and remember that the
 *   conversation was reviewed (negative memory: a dismissed topic is never suggested again).
 * - It matches an open suggestion: attach the conversation as more evidence.
 * - Nothing matches: create a new suggestion.
 */
export type MatchPool = "approved" | "dismissed" | "open";
export type Route =
  | { action: "discard"; reason: "approved_match" | "dismissed_match" }
  | { action: "attach"; suggestionId: string }
  | { action: "create" };

export function routeCandidate(
  match: { pool: MatchPool; id: string } | null,
): Route {
  if (!match) return { action: "create" };
  if (match.pool === "approved")
    return { action: "discard", reason: "approved_match" };
  if (match.pool === "dismissed")
    return { action: "discard", reason: "dismissed_match" };
  return { action: "attach", suggestionId: match.id };
}
