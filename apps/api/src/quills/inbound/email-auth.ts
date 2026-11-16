import type { EmailAuth, EmailAuthResult } from "../../database/quills/types";

// The SPF, DKIM and DMARC results of an inbound mail, read from the receiving server's
// Authentication-Results header (RFC 8601). A sender can write its own Authentication-Results
// headers, so only a header whose authserv-id is the trusted receiving server counts, and of
// those only the first (the receiver adds its header on top). Without a trusted ID nothing counts.

const MAX_COMMENT_PASSES = 10;

/** "pass", "fail" for a negative result, and "none" for no conclusive result. */
const results: Record<string, EmailAuthResult> = {
  pass: "pass",
  fail: "fail",
  softfail: "fail",
  hardfail: "fail",
  permerror: "fail",
};

/** The header without (comments). Comments can nest, so each pass removes the innermost ones. */
function withoutComments(value: string) {
  let text = value;
  for (let pass = 0; pass < MAX_COMMENT_PASSES && text.includes("("); pass++)
    text = text.replace(/\([^()]*\)/g, " ");
  return text;
}

/** One header value: its authserv-id and the result of each method it names. */
export function parseAuthenticationResults(value: string) {
  const [id = "", ...parts] = withoutComments(value).split(";");
  const found: Record<string, EmailAuthResult[]> = {};
  for (const part of parts) {
    const match = /^\s*(spf|dkim|dmarc)\s*=\s*([a-z]+)/i.exec(part);
    if (!match) continue;
    const method = match[1]!.toLowerCase();
    (found[method] ??= []).push(results[match[2]!.toLowerCase()] ?? "none");
  }
  // Several DKIM signatures: one valid signature passes.
  const pick = (method: string): EmailAuthResult => {
    const list = found[method] ?? [];
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
