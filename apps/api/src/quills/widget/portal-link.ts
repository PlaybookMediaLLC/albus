import { and, eq, isNotNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { apiRouter, z } from "../../openapi";
import { principal, user as customer } from "../../database/quills/schema/auth";
import { kvStore } from "../../database/quills/schema/kv";
import { defineQuillsRoute } from "../framework/define-route";
import { hashToken } from "../framework/audience";
import { sendSignInLink, signInDelivery } from "../framework/sign-in-link";
import { requirePortal } from "../portal/feedback/viewer";

// "Open in portal" (issue #129, option C). The widget session never signs anyone in: Kaneo's own
// sign-in link goes to the identified visitor's email, and opening it proves the address. The
// portal then links the two profiles (portal/widget-link.ts).

/** How long a widget profile's request to be linked stays open. The sign-in link lasts 5 minutes. */
const REQUEST_TTL_MS = 15 * 60 * 1000;
/** The kv_store key of a pending link request for an address, read by portal/widget-link.ts. */
export const portalLinkKey = (email: string) =>
  `widget:portal-link:${hashToken(email.toLowerCase())}`;

const portalLink = defineQuillsRoute({
  audience: "widget",
  method: "post",
  path: "/widget/portal-link",
  operationId: "sendQuillsWidgetPortalLink",
  summary: "Mail the identified visitor a sign-in link to the portal",
  description:
    "Sends the instance's sign-in link to the email of the visitor that the host app identified. The link works once, expires after 5 minutes and opens the portal's My feedback page signed in. For the next 15 minutes, the portal asks a signed-in account with that verified address to confirm linking this widget profile (GET, POST and DELETE /portal/widget-link). A used or expired link opens the sign-in page with the error. With registration closed, only an address that has an account gets the mail, and delivery is if_account. 403 for an anonymous visitor, or when the instance cannot mail a sign-in link (no mail delivery, login form off, captcha on); 404 while the portal is closed.",
  action: "create",
  rateLimit: { limit: 10, windowSeconds: 15 * 60 },
  response: z.object({
    sent: z.boolean(),
    delivery: z.enum(["sent", "if_account"]).openapi({
      description:
        "sent: the instance mails any address. if_account: registration is closed, so it mails only an address that has an account; the API never says which, so the visitor is told so.",
    }),
  }),
  responseDescription:
    "The sign-in link was handed to the instance's mail delivery",
  errors: {
    403: "Anonymous visitor, blocked person, or the instance cannot send a sign-in link",
  },
  event: {
    none: "A pending link request in kv_store (15 minutes) and the sign-in mail; no customer record changes",
  },
  prepare: async ({ db, caller }) => {
    await requirePortal(db);
    const [row] = await db
      .select({ email: customer.email })
      .from(principal)
      .innerJoin(customer, eq(customer.id, principal.userId))
      .where(
        and(
          eq(principal.id, caller.principalId!),
          eq(principal.type, "user"),
          // Only a verified identify sets external_id.
          isNotNull(customer.externalId),
        ),
      )
      .limit(1);
    if (!row?.email)
      throw new HTTPException(403, {
        message:
          "Only a visitor that the host app identified can open the portal",
      });
    return { email: row.email };
  },
  call: async ({ email }, { workspaceId }) => {
    const delivery = await signInDelivery();
    await sendSignInLink(email, workspaceId);
    return { email, delivery };
  },
  // Only this widget profile, for this address, may be linked by the next portal sign-in.
  handler: async ({ db, caller, called: { email, delivery } }) => {
    const request = {
      value: { principalId: caller.principalId },
      expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
    };
    await db
      .insert(kvStore)
      .values({ workspaceKey: "_", key: portalLinkKey(email), ...request })
      .onConflictDoUpdate({
        target: [kvStore.workspaceId, kvStore.workspaceKey, kvStore.key],
        set: request,
      });
    return { sent: true, delivery };
  },
});

export default apiRouter().openapi(...portalLink);
