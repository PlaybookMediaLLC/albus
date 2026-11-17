import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { Database } from "../../database/quills/client";
import { settings } from "../../database/quills/schema/auth";
import { resolveAuthSecret } from "../../utils/auth-secret";

// Short-lived signed grants of the portal token sign-in (gaps G-17 and G-24). Kaneo accounts stay
// the one login system: a host-signed identity reaches the portal as a Kaneo session, and only into
// a portal-only account that this sign-in created for the same workspace's customer
// (auth/quills-portal-session.ts). Each grant names one purpose, so a grant of one step is never
// accepted by another.

/** The Kaneo account provider that links a token-created account to its workspace customer. */
export const PORTAL_TOKEN_PROVIDER = "quills-portal";
export const portalTokenAccountId = (workspaceId: string, customerId: string) =>
  `${workspaceId}:${customerId}`;

type Purpose = "handoff" | "session";
const TTL_MS: Record<Purpose, number> = {
  // The widget asks for a link when the visitor clicks it: two minutes covers a slow tab.
  handoff: 2 * 60 * 1000,
  // The browser follows the redirect at once.
  session: 60 * 1000,
};

export type HandoffGrant = {
  workspaceId: string;
  customerId: string;
  next: string;
};
export type SessionGrant = HandoffGrant & { email: string; name: string };
type Claims = { handoff: HandoffGrant; session: SessionGrant };

const key = (purpose: Purpose) =>
  createHmac("sha256", resolveAuthSecret())
    .update(`quills-portal-sign-in:${purpose}`)
    .digest();
// Hashed first, so neither length leaks. Local: signed.ts imports platform-reads, which imports this.
const sameText = (given: string, expected: string) =>
  timingSafeEqual(
    createHash("sha256").update(given).digest(),
    createHash("sha256").update(expected).digest(),
  );
const sign = (purpose: Purpose, payload: string) =>
  createHmac("sha256", key(purpose)).update(payload).digest("base64url");

/** A signed, expiring grant. Its nonce makes each one unique, so a receipt can accept it once. */
export function mintGrant<P extends Purpose>(
  purpose: P,
  claims: Claims[P],
  ttlMs = TTL_MS[purpose],
) {
  const payload = Buffer.from(
    JSON.stringify({
      ...claims,
      nonce: randomBytes(16).toString("base64url"),
      expiresAt: Date.now() + ttlMs,
    }),
  ).toString("base64url");
  return `${payload}.${sign(purpose, payload)}`;
}

/** The claims and nonce of a grant this instance signed for `purpose`, or null. */
export function readGrant<P extends Purpose>(
  purpose: P,
  grant: string,
): (Claims[P] & { nonce: string }) | null {
  const [payload, signature, extra] = grant.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  if (!sameText(signature, sign(purpose, payload))) return null;
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
  const fields =
    purpose === "session"
      ? ["workspaceId", "customerId", "next", "nonce", "email", "name"]
      : ["workspaceId", "customerId", "next", "nonce"];
  if (
    fields.some((field) => typeof value[field] !== "string") ||
    typeof value.expiresAt !== "number" ||
    Date.now() > value.expiresAt
  )
    return null;
  return value as unknown as Claims[P] & { nonce: string };
}

/**
 * A portal path to land on after sign-in: relative to the portal home, such as `/boards/b1`.
 * Anything else (another origin, `//host`, a backslash) lands on the portal home: no open redirect.
 */
export function safePortalPath(next: string | undefined) {
  if (!next) return "";
  return /^\/(?![/\\])[\w\-./~%?=&]*$/.test(next) && next.length <= 300
    ? next
    : "";
}

// The portal sign-in policy that portal/sign-in-settings.ts stores in the portal config.
export const SIGN_IN_MODES = ["account", "sso", "disabled"] as const;
export type PortalSignIn = {
  mode: (typeof SIGN_IN_MODES)[number];
  widgetSignIn: boolean;
  ssoUrl: string | null;
};

const httpUrl = (value: unknown) => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

/** The stored policy; an unreadable or incomplete value is the default Kaneo sign-in. */
export function readPortalSignIn(portalConfig: string | null): PortalSignIn {
  let config: unknown;
  try {
    config = JSON.parse(portalConfig || "{}");
  } catch {
    config = {};
  }
  const stored = (config as { signIn?: unknown } | null)?.signIn;
  const value: Record<string, unknown> =
    stored && typeof stored === "object" ? { ...stored } : {};
  const ssoUrl = httpUrl(value.ssoUrl);
  const mode = SIGN_IN_MODES.find((m) => m === value.mode) ?? "account";
  return {
    mode: mode === "sso" && !ssoUrl ? "account" : mode,
    widgetSignIn: value.widgetSignIn === true,
    ssoUrl,
  };
}

/** The workspace's stored portal sign-in policy. */
export async function portalSignIn(db: Database) {
  const [row] = await db
    .select({ portalConfig: settings.portalConfig })
    .from(settings)
    .limit(1);
  return readPortalSignIn(row?.portalConfig ?? null);
}
