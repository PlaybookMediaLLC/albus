import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { apiRouter, z } from "../../openapi";
import { principal, user as customer } from "../../database/quills/schema/auth";
import { defineQuillsRoute } from "../framework/define-route";
import { mintGrant, safePortalPath } from "../framework/portal-sign-in";
import { signedUrl } from "../integrations/oauth-providers";
import { requirePortal } from "../portal/feedback/viewer";
import { portalSignIn } from "../portal/sign-in-settings";

// The widget opens the portal with the visitor signed in (gap G-17). The host app identified the
// visitor with its signed token; this route turns that widget session into a one-time link. The
// link's signed route (portal/token-sign-in.ts) and Kaneo's sign-in (auth/quills-portal-session.ts)
// finish it. Off until a teammate turns on widget sign-in.

const handoff = defineQuillsRoute({
  audience: "widget",
  method: "post",
  path: "/widget/portal-sign-in",
  operationId: "createQuillsWidgetPortalSignIn",
  summary: "Get a link that opens the portal signed in",
  description:
    "For a visitor that the host app identified, when widget sign-in is on. The link works once, for two minutes. `next` is a portal path such as /boards/b1; an empty or other value opens the portal home.",
  action: "create",
  rateLimit: { limit: 20, windowSeconds: 600 },
  body: z.object({ next: z.string().max(300) }),
  response: z.object({ url: z.string() }),
  responseDescription: "The one-time sign-in link",
  errors: {
    403: "Widget sign-in is off, or the visitor is not identified",
    404: "The portal is off",
  },
  event: { none: "Issues a link; the sign-in records nothing in Quills" },
  handler: async ({ db, caller, body, workspaceId }) => {
    await requirePortal(db);
    if (!(await portalSignIn(db)).widgetSignIn)
      throw new HTTPException(403, {
        message: "Widget sign-in is off for this portal",
      });
    const [visitor] = await db
      .select({
        type: principal.type,
        externalId: customer.externalId,
        email: customer.email,
      })
      .from(principal)
      .innerJoin(customer, eq(customer.id, principal.userId))
      .where(eq(principal.id, caller.principalId!));
    if (visitor?.type !== "user" || !visitor.externalId || !visitor.email)
      throw new HTTPException(403, {
        message: "Only a visitor that the host app identified signs in here",
      });
    const code = mintGrant("handoff", {
      workspaceId,
      customerId: caller.customerId!,
      next: safePortalPath(body.next),
    });
    return {
      url: signedUrl(
        `/portal-sign-in?${new URLSearchParams({ workspace: workspaceId, code })}`,
      ),
    };
  },
});

export default apiRouter().openapi(...handoff);
