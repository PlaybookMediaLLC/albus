import { apiRouter, z } from "../../openapi";
import { defineQuillsRoute } from "../framework/define-route";
import { evaluatePortalAccess } from "../framework/audience";
import { requirePortal } from "./feedback/viewer";
import { SIGN_IN_MODES } from "../framework/portal-sign-in";
import { portalSignIn } from "./sign-in-settings";

// The private-portal gate for the calling Kaneo account. Only the decision leaves the server;
// the policy (allowed domains and segments) does not.

const decision = z.object({
  granted: z.boolean(),
  reason: z.enum([
    "public",
    "team",
    "domain",
    "segment",
    "invite",
    "widget",
    "unauthenticated",
    "unauthorized",
  ]),
});

const myAccess = defineQuillsRoute({
  audience: "portal",
  signIn: false,
  method: "get",
  path: "/portal/access",
  operationId: "evaluateQuillsMyPortalAccess",
  summary: "Evaluate the caller's portal access",
  description:
    "A workspace member is granted with the reason team but still acts as a customer on portal routes.",
  action: "read",
  response: decision.extend({
    /** How this portal's sign-in button works (gap G-24). ssoUrl is the host app's login page. */
    signIn: z.object({
      mode: z.enum(SIGN_IN_MODES),
      ssoUrl: z.string().nullable(),
    }),
  }),
  responseDescription: "The access decision and the sign-in mode",
  handler: async ({ db, caller }) => {
    await requirePortal(db);
    const { mode, ssoUrl } = await portalSignIn(db);
    return {
      ...(await evaluatePortalAccess(db, caller)),
      signIn: { mode, ssoUrl: mode === "sso" ? ssoUrl : null },
    };
  },
});

const recordDenied = defineQuillsRoute({
  audience: "portal",
  method: "post",
  path: "/portal/access-denied",
  operationId: "recordQuillsPortalAccessDenied",
  summary: "Record that the portal denied the caller",
  description:
    "The server evaluates the decision again; a caller who has access records nothing.",
  action: "update",
  rateLimit: { limit: 20, windowSeconds: 600 },
  response: z.object({ recorded: z.boolean(), reason: decision.shape.reason }),
  responseDescription: "Whether a denial was recorded",
  event: ({ workspaceId }, result) =>
    result.recorded && {
      type: "portal.access_denied",
      entityType: "settings",
      entityId: workspaceId,
      payload: { reason: result.reason },
    },
  handler: async ({ db, caller }) => {
    await requirePortal(db);
    const access = await evaluatePortalAccess(db, caller);
    return { recorded: !access.granted, reason: access.reason };
  },
});

export default apiRouter()
  .openapi(...myAccess)
  .openapi(...recordDenied);
