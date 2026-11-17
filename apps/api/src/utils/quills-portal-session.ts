import { createAuthEndpoint, getSessionFromCtx } from "better-auth/api";
import type { GenericEndpointContext } from "better-auth";
import { setSessionCookie } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { z } from "zod";
import db from "../database";
import { workspaceUserTable } from "../database/schema";
import {
  PORTAL_TOKEN_PROVIDER,
  portalTokenAccountId,
  readGrant,
} from "../quills/framework/portal-sign-in";
import { portalPaths } from "../quills/portal/paths";
import { isPortalBrowser, portalBrowserCookie } from "./quills-portal-browser";
import { quillsPortalSignInStart } from "./quills-portal-sign-in-start";

// Kaneo's half of the Quills portal token sign-in (gaps G-17 and G-24). Kaneo accounts stay the
// one login system: the host app's token (checked by quills/portal/token-sign-in.ts) reaches the
// portal as a normal Kaneo session. It signs in only to a portal-only account that this flow
// created for the same workspace's customer, linked by a "quills-portal" account row like a
// social sign-in. An email that already has any other Kaneo account goes to the Kaneo sign-in page,
// so a compromised host app can never reach a teammate's or another workspace's account.

export const QUILLS_PORTAL_SESSION_PATH = "/quills/portal-session";

/** No workspace membership and no instance admin role: the account only ever signed in to portals. */
async function portalOnly(user: {
  id: string;
  role?: unknown;
  banned?: unknown;
}) {
  if (user.role === "admin" || user.banned === true) return false;
  const [member] = await db
    .select({ id: workspaceUserTable.id })
    .from(workspaceUserTable)
    .where(eq(workspaceUserTable.userId, user.id))
    .limit(1);
  return !member;
}

type Adapter = Pick<
  GenericEndpointContext["context"]["internalAdapter"],
  | "findAccountByKey"
  | "findUserById"
  | "findUserByEmail"
  | "createUser"
  | "createAccount"
>;
type Grant = {
  workspaceId: string;
  customerId: string;
  email: string;
  name: string;
};

/**
 * The Kaneo account a token sign-in may use, or null for the Kaneo sign-in page: the portal-only
 * account that token sign-in created for this workspace's customer, or a new one when the email
 * has no Kaneo account yet. Never any other account.
 */
export async function tokenSignInUser(
  adapter: Adapter,
  grant: Grant,
  isPortalOnly: (user: {
    id: string;
    role?: unknown;
    banned?: unknown;
  }) => Promise<boolean>,
) {
  const accountId = portalTokenAccountId(grant.workspaceId, grant.customerId);
  const link = await adapter.findAccountByKey({
    providerId: PORTAL_TOKEN_PROVIDER,
    accountId,
  });
  if (link) {
    const user = await adapter.findUserById(link.userId);
    return user && (await isPortalOnly(user)) ? user : null;
  }
  if (await adapter.findUserByEmail(grant.email)) return null;
  let user;
  try {
    // The create hook in auth.ts gives this path the plain user role and never promotes it.
    user = await adapter.createUser(
      { email: grant.email, name: grant.name, emailVerified: false },
      { method: "quills-portal-token" },
    );
  } catch {
    // Registration closed on this instance, or a concurrent sign-in took the email.
    return null;
  }
  await adapter.createAccount({
    userId: user.id,
    providerId: PORTAL_TOKEN_PROVIDER,
    accountId,
  });
  return user;
}

const clientHome = () =>
  (process.env.KANEO_CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

export const quillsPortalSession = {
  id: "quills-portal-session",
  endpoints: {
    quillsPortalSignInStart,
    quillsPortalSession: createAuthEndpoint(
      QUILLS_PORTAL_SESSION_PATH,
      {
        method: "GET",
        query: z.object({ grant: z.string().max(4000) }),
        metadata: { isAction: false },
      },
      async (ctx) => {
        const grant = readGrant("session", ctx.query.grant);
        if (!grant) throw ctx.redirect(clientHome());
        const home = portalPaths.home(grant.workspaceId);
        const signInRequired = `${home}?signIn=required`;
        // Only the browser that started this sign-in may finish it (login CSRF). Its cookie is
        // used up here, whatever the outcome.
        const secure = ctx.context.baseURL.startsWith("https:");
        const cookie = portalBrowserCookie(secure);
        const browser = ctx.getCookie(cookie);
        ctx.setCookie(cookie, "", {
          path: "/",
          maxAge: 0,
          httpOnly: true,
          sameSite: "lax",
          secure,
        });
        if (!isPortalBrowser(browser, grant.workspaceId, grant.state))
          throw ctx.redirect(`${home}?signIn=failed`);
        const adapter = ctx.context.internalAdapter;
        // A grant works once: the reservation is atomic, a repeat gets false.
        const first = await adapter.reserveVerificationValue({
          identifier: `quills-portal-grant:${grant.nonce}`,
          value: "used",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
        if (!first) throw ctx.redirect(`${home}?signIn=failed`);
        // A browser that is already signed in keeps its own account.
        if (await getSessionFromCtx(ctx)) throw ctx.redirect(home + grant.next);

        const user = await tokenSignInUser(adapter, grant, portalOnly);
        if (!user) throw ctx.redirect(signInRequired);
        const session = await adapter.createSession(user.id);
        await setSessionCookie(ctx, { session, user });
        throw ctx.redirect(home + grant.next);
      },
    ),
  },
};
