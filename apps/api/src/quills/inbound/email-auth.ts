// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.

// The same shapes as EmailAuth in database/quills/types.ts, which a route helper cannot import.
type EmailAuthResult = "pass" | "fail" | "none";
type EmailAuth = {
  spf: EmailAuthResult;
  dkim: EmailAuthResult;
  dmarc: EmailAuthResult;
};

// The SPF, DKIM and DMARC results of an inbound mail, read from the receiving server's
// Authentication-Results header (RFC 8601). A sender can write its own Authentication-Results
// headers, so only a header whose authserv-id is the trusted receiving server counts, and of
// those only the first (the receiver adds its header on top). Without a trusted ID nothing counts.
// The caller passes the headers in their order; a map of headers keeps one copy and cannot.

const MAX_COMMENT_PASSES = 10;

/** "pass", "fail" for a negative result, and "none" for no conclusive result. */
const results: Record<string, EmailAuthResult> = {
  pass: "pass",
  fail: "fail",
  softfail: "fail",
  hardfail: "fail",
  permerror: "fail",
};

/**
 * The header without "quoted strings" and (comments). A quoted value, such as an envelope local
 * part, can hold ";" and "spf=pass", so it must not split or add results. Comments can nest, so
 * each pass removes the innermost ones.
 */
function withoutQuotesAndComments(value: string) {
  let text = value.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  for (let pass = 0; pass < MAX_COMMENT_PASSES && text.includes("("); pass++)
    text = text.replace(/\([^()]*\)/g, " ");
  return text;
}

/** One header value: its authserv-id and the result of each method it names. */
export function parseAuthenticationResults(value: string) {
  const [id = "", ...parts] = withoutQuotesAndComments(value).split(";");
  const found: Record<string, EmailAuthResult[]> = {};
  for (const part of parts) {
    const match = /^\s*(spf|dkim|dmarc)\s*=\s*([a-z]+)/i.exec(part);
    if (!match) continue;
    const method = match[1]!.toLowerCase();
    (found[method] ??= []).push(results[match[2]!.toLowerCase()] ?? "none");
  }
  // Several DKIM signatures: one valid signature passes. SPF and DMARC have one result; a
  // repeat never upgrades the first.
  const pick = (method: string): EmailAuthResult => {
    const list = found[method] ?? [];
    if (method !== "dkim") return list[0] ?? "none";
    return list.includes("pass")
      ? "pass"
      : list.includes("fail")
        ? "fail"
        : "none";
  };
  return {
    authservId: id.trim().split(/\s+/)[0]?.toLowerCase() ?? "",
    auth: { spf: pick("spf"), dkim: pick("dkim"), dmarc: pick("dmarc") },
  };
}

/**
 * The results of the first Authentication-Results header from `trustedId`, in header order.
 * Null when no trusted ID is set or no such header exists.
 */
export function trustedEmailAuth(
  headers: readonly string[],
  trustedId: string,
): EmailAuth | null {
  const trusted = trustedId.trim().toLowerCase();
  if (!trusted) return null;
  for (const header of headers) {
    const parsed = parseAuthenticationResults(header);
    if (parsed.authservId === trusted) return parsed.auth;
  }
  return null;
}
