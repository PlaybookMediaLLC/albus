import { HTTPException } from "hono/http-exception";
import { apiRouter, z } from "../../openapi";
import { settings } from "../../database/quills/schema/auth";
import { defineQuillsRoute } from "../framework/define-route";
import {
  mintWidgetSession,
  verifyIdentityToken,
  widgetEnabled,
} from "../framework/audience";
import { mergeAnonymousSession } from "./anonymous-merge";
import { votedPostIds } from "./identify-claims";
import { identifyCustomer } from "./identify-customer";
import { portalSignIn } from "../portal/sign-in-settings";
import { signInLinkAvailable } from "../framework/sign-in-link";
import { parseJson } from "../settings/area";

// Verified-only identify: the host app's backend signs an HS256 JWT with the widget secret,
// and only that token can name a customer. There is no unverified email path.

/** How the widget can take an identified visitor to the portal, while the portal is on. */
async function handoff(
  db: Parameters<typeof portalSignIn>[0],
  portalConfig: string | null,
) {
  const open = parseJson(portalConfig).enabled === true;
  const portalSignInOn = open && (await portalSignIn(db)).widgetSignIn;
  return {
    canPortalHandoff: portalSignInOn || (open && signInLinkAvailable()),
    portalSignIn: portalSignInOn,
  };
}

const identify = defineQuillsRoute({
  audience: "widget",
  signIn: false,
  method: "post",
  path: "/widget/identify",
  operationId: "identifyQuillsWidgetVisitor",
  summary: "Identify a widget visitor with a signed token",
  description:
    "Creates or updates the customer that the host app's signed ssoToken names and returns a widget session token for the Authorization header. The token needs sub (or id), email and exp, at most one hour after iat (or after now without iat); a future iat is refused. Optional claims: name, or firstName and lastName; avatarURL (or avatar); custom attributes, top level or in a traits object, that match a user attribute definition (at most 50; others are dropped and reported in warnings); companies (the first, by its id, becomes the person's company), segments (at most 50 manual segment slugs; it replaces the widget-sourced memberships, and a missing claim removes them). Identify also subscribes the person to the changelog when the workspace auto-subscribes. A profile that a portal sign-in linked to an account resolves only by its sub and email together, and the token never changes its name, email or avatar. canPortalHandoff is true while the portal is on and the widget can take the visitor there: portalSignIn says it signs them in at once (POST /widget/portal-sign-in, when a teammate turned widget sign-in on); otherwise POST /widget/portal-link mails a sign-in link, when the instance can mail one (mail delivery on, login form on, no captcha).",
  action: "create",
  rateLimit: { limit: 60, windowSeconds: 15 * 60 },
  body: z.object({
    ssoToken: z.string().min(1).max(8192),
    /**
     * The widget's anonymous session token, sent also as the Bearer token: its conversations,
     * votes and other activity move to the identified person, and the anonymous session ends.
     */
    previousToken: z.string().min(1).max(200).optional(),
  }),
  response: z.object({
    sessionToken: z.string(),
    principalId: z.string(),
    /** The anonymous principal whose activity moved to this person, or null. */
    mergedPrincipalId: z.string().nullable(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    }),
    canPortalHandoff: z.boolean(),
    /** The portal opens with this visitor signed in (gap G-17); else the link is mailed. */
    portalSignIn: z.boolean(),
    /** The live posts the person voted on, newest first, at most 500. */
    votedPostIds: z.array(z.string()),
    /** Claims that were received but not applied; the identify still succeeded. */
    warnings: z.array(
      z.object({
        code: z.enum([
          "ATTRIBUTE_IGNORED",
          "SEGMENT_IGNORED",
          "COMPANY_IGNORED",
          "COMPANY_DOMAIN_IGNORED",
        ]),
        field: z.string(),
      }),
    ),
  }),
  responseDescription: "The widget session and the identified customer",
  errors: {
    403: "Widget disabled, identify not configured, invalid token or blocked person",
    409: "The email belongs to another customer",
  },
  allowKeys: ["sessionToken"],
  event: (_input, result) => [
    {
      type: "user.identified",
      entityType: "principal",
      entityId: result.principalId,
    },
    ...(result.mergedPrincipalId
      ? [
          {
            type: "user.lead_merged" as const,
            entityType: "principal" as const,
            entityId: result.principalId,
            payload: { leadPrincipalId: result.mergedPrincipalId },
          },
        ]
      : []),
  ],
  handler: async ({ db, body, caller }) => {
    const [config] = await db
      .select({
        widgetConfig: settings.widgetConfig,
        widgetSecret: settings.widgetSecret,
        portalConfig: settings.portalConfig,
      })
      .from(settings)
      .limit(1);
    if (!widgetEnabled(config?.widgetConfig ?? null))
      throw new HTTPException(403, { message: "Widget is not enabled" });
    if (!config?.widgetSecret)
      throw new HTTPException(403, {
        message: "Widget identify is not configured",
      });
    const raw = verifyIdentityToken(body.ssoToken, config.widgetSecret);
    if (!raw)
      throw new HTTPException(403, { message: "Invalid or expired ssoToken" });
    const { identity, person, warnings } = await identifyCustomer(db, raw);
    // The Bearer resolved to the caller's anonymous session; the body names the same session.
    const mergedPrincipalId =
      body.previousToken && caller.principalId
        ? await mergeAnonymousSession(
            db,
            body.previousToken,
            caller.principalId,
            person.id,
          )
        : null;
    const session = await mintWidgetSession(
      db,
      { principalId: person.id, customerId: identity.id },
      config.widgetSecret,
    );
    return {
      sessionToken: session.token,
      principalId: person.id,
      mergedPrincipalId,
      user: {
        id: identity.id,
        name: identity.name,
        email: identity.email,
        avatarUrl: identity.image,
      },
      // Gap G-17: widget/portal-sign-in.ts signs the visitor in at once; else portal-link.ts mails a
      // Kaneo sign-in link and the portal links the profiles (portal/widget-link.ts).
      ...(await handoff(db, config.portalConfig)),
      votedPostIds: await votedPostIds(db, person.id),
      warnings,
    };
  },
});

export default apiRouter().openapi(...identify);
