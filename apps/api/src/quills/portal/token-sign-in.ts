import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { apiRouter, z } from "../../openapi";
import {
  principal,
  settings,
  user as customer,
} from "../../database/quills/schema/auth";
import { verifyIdentityToken } from "../framework/audience";
import { defineQuillsRoute } from "../framework/define-route";
import {
  mintGrant,
  readGrant,
  safePortalPath,
} from "../framework/portal-sign-in";
import { digest, unauthorized, type SignedVerifier } from "../framework/signed";
import { identifyCustomer } from "../widget/identify-customer";
import { requirePortal } from "./feedback/viewer";
import { portalPaths } from "./paths";
import { portalSignIn } from "./sign-in-settings";

// The first step of a portal token sign-in (gaps G-17 and G-24). The browser arrives with either
// the widget's one-time code (widget/portal-sign-in.ts) or, in SSO mode, a token that the host app
// signed with the widget secret. This route checks it, finds the customer, and hands Kaneo's
// sign-in (auth/quills-portal-session.ts) a one-minute grant. Each code or token works once.

type Credential =
  | { kind: "handoff"; customerId: string; next: string }
  | {
      kind: "sso";
      raw: NonNullable<ReturnType<typeof verifyIdentityToken>>;
      next: string;
    };

const portalTokenSignIn: SignedVerifier<Credential> = {
  name: "portal-token-sign-in",
  locate: ({ query }) => {
    if (query.code) {
      const code = readGrant("handoff", query.code);
      // The query names the same workspace, so a failure page can still find the portal.
      if (!code || code.workspaceId !== query.workspace) throw unauthorized();
      return {
        scope: { workspace: code.workspaceId },
        deliveryId: `handoff:${code.nonce}`,
        claims: { customerId: code.customerId, next: code.next },
      };
    }
    if (!query.token || !query.workspace) throw unauthorized();
    // The token is checked against the named workspace's widget secret in `verify`.
    return {
      scope: { workspace: query.workspace },
      deliveryId: `sso:${digest(query.token)}`,
    };
  },
  verify: async (db, { query }, located) => {
    if (located.claims?.customerId)
      return {
        kind: "handoff",
        customerId: located.claims.customerId,
        next: located.claims.next ?? "",
      };
    const [row] = await db
      .select({ widgetSecret: settings.widgetSecret })
      .from(settings)
      .limit(1);
    const raw = row?.widgetSecret
      ? verifyIdentityToken(query.token ?? "", row.widgetSecret)
      : null;
    if (!raw) throw unauthorized();
    return { kind: "sso", raw, next: safePortalPath(query.next) };
  },
};

const API_BASE = () =>
  new URL(process.env.KANEO_API_URL || "http://localhost:1337").origin;
const portalHome = (workspace: string | undefined) =>
  portalPaths.home(workspace ?? "");

const tokenSignIn = defineQuillsRoute({
  audience: "signed",
  verifier: portalTokenSignIn,
  method: "get",
  path: "/portal-sign-in",
  operationId: "startQuillsPortalTokenSignIn",
  summary: "Sign in to the portal with a widget link or an SSO token",
  description:
    "A browser navigation. `code` is the widget's one-time link (widget sign-in on). `token` is a token that the host app signed with the widget secret, as for widget identify, when the portal's sign-in mode is sso; `next` is then the portal path to open. Each works once. The browser continues to the account sign-in, which signs in only to a portal-only account that token sign-in created for this customer; another account with the email means the sign-in page.",
  action: "create",
  query: z.object({
    workspace: z.string().min(1).max(100),
    code: z.string().max(2000).optional(),
    token: z.string().max(8192).optional(),
    next: z.string().max(300).optional(),
  }),
  response: z.object({ grant: z.string() }),
  responseDescription: "The grant for the account sign-in",
  errors: {
    403: "Token sign-in is off, or the customer is blocked",
    404: "The portal is off",
  },
  // A code or token that already signed someone in opens the portal signed out.
  replay: { grant: "" },
  redirect: {
    success: ({ grant }, { query }) =>
      grant
        ? `${API_BASE()}/api/auth/quills/portal-session?${new URLSearchParams({ grant })}`
        : `${portalHome(query?.workspace)}?signIn=failed`,
    failure: (_status, { query }) =>
      `${portalHome(query?.workspace)}?signIn=failed`,
  },
  event: {
    none: "The account sign-in owns the session; this records the receipt only",
  },
  handler: async ({ db, credential, workspaceId }) => {
    await requirePortal(db);
    const policy = await portalSignIn(db);
    if (
      credential.kind === "handoff"
        ? !policy.widgetSignIn
        : policy.mode !== "sso"
    )
      throw new HTTPException(403, {
        message: "Token sign-in is off for this portal",
      });
    const customerId =
      credential.kind === "handoff"
        ? credential.customerId
        : (await identifyCustomer(db, credential.raw)).identity.id;
    const [person] = await db
      .select({
        email: customer.email,
        name: customer.name,
        blockedAt: principal.blockedAt,
      })
      .from(customer)
      .innerJoin(principal, eq(principal.userId, customer.id))
      .where(eq(customer.id, customerId as typeof customer.$inferSelect.id));
    if (!person?.email || person.blockedAt)
      throw new HTTPException(403, { message: "This person cannot sign in" });
    return {
      grant: mintGrant("session", {
        workspaceId,
        customerId,
        next: credential.next,
        email: person.email.toLowerCase(),
        name: person.name,
      }),
    };
  },
});

export default apiRouter().openapi(...tokenSignIn);
