import { createHmac } from "node:crypto";
import type { HostUser } from "./users.ts";
import type { TokenVariant } from "./variants.ts";

const part = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

/** An HS256 JWT, as `apps/api/src/quills/framework/audience.ts#verifyIdentityToken` expects. */
export function signHs256(claims: Record<string, unknown>, secret: string) {
  const unsigned = `${part({ alg: "HS256", typ: "JWT" })}.${part(claims)}`;
  const signature = createHmac("sha256", secret)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

/** The identify token for a host user. Valid tokens live 10 minutes. */
export function identityToken(
  user: HostUser,
  variant: TokenVariant,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  const claims: Record<string, unknown> = {
    sub: user.sub,
    email: user.email,
    name: user.name,
    // `plan` goes in a traits object; a top-level claim works the same way.
    ...(user.plan && { traits: { plan: user.plan } }),
    ...(user.segments && { segments: user.segments }),
    ...(user.company && { companies: [user.company] }),
    iat: now,
    exp: variant === "expired" ? now - 60 : now + 600,
  };
  if (variant === "no-sub") delete claims.sub;
  if (variant === "no-email") delete claims.email;
  return signHs256(
    claims,
    variant === "bad-signature" ? `${secret}-wrong` : secret,
  );
}
