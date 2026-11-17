import { and, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";
import type { PrincipalId } from "@kaneo/ids";
import { apiRouter, z } from "../../openapi";
import { principal, user as customer } from "../../database/quills/schema/auth";
import { kvStore } from "../../database/quills/schema/kv";
import { defineQuillsRoute, type Database } from "../framework/define-route";
import { portalCaller, type QuillsCaller } from "../framework/audience";
import { mergeMetadata, parseMetadata } from "../directory/customer";
import { repoint } from "../directory/lead-merge";
import { portalLinkKey } from "../widget/portal-link";
import { requirePortal } from "./feedback/viewer";

// Issue #129, option C: one customer, one history. A widget profile (named by the host app's
// signed token) that pressed "Open in portal" joins the caller's portal profile when the Kaneo
// account's verified email is the widget profile's email in this workspace, and the person
// confirms it in the portal. Mail proves the email; the host's token alone never reaches a Kaneo
// account. The widget's sub moves to the portal profile, so the next identify resolves there
// (widget/identify.ts).

/** The caller's pending request: its kv_store row (by email) and the widget profile it names. */
function requestOf(db: Database, caller: QuillsCaller) {
  const email = caller.account!.email.toLowerCase();
  const key = and(
    eq(kvStore.workspaceKey, "_"),
    eq(kvStore.key, portalLinkKey(email)),
  );
  /** A live request's widget principal; `lock` holds the row, so a request links once. */
  const requested = async (lock: boolean) => {
    const query = db
      .select({ value: kvStore.value })
      .from(kvStore)
      .where(and(key, gt(kvStore.expiresAt, sql`now()`)));
    const [row] = lock ? await query.for("update") : await query;
    const id = (row?.value as { principalId?: unknown } | undefined)
      ?.principalId;
    return typeof id === "string" ? (id as PrincipalId) : null;
  };
  /** That widget profile while it is still the address's, unlinked, unblocked and not a test customer. */
  const profile = (id: PrincipalId) =>
    db
      .select({
        customerId: customer.id,
        principalId: principal.id,
        externalId: customer.externalId,
        metadata: customer.metadata,
      })
      .from(customer)
      .innerJoin(principal, eq(principal.userId, customer.id))
      .where(
        and(
          eq(principal.id, id),
          sql`lower(${customer.email}) = ${email}`,
          eq(customer.emailVerified, true),
          isNotNull(customer.externalId),
          isNull(customer.kaneoUserId),
          eq(principal.type, "user"),
          isNull(principal.testOwnerPrincipalId),
          isNull(principal.blockedAt),
        ),
      )
      .limit(1);
  return { email, key, requested, profile };
}

/** Who may link: a verified account that is not a workspace member, whose customer profile the directory lists. */
const eligible = (caller: QuillsCaller) =>
  caller.account!.emailVerified && !caller.account!.member;

const pendingLink = defineQuillsRoute({
  audience: "portal",
  method: "get",
  path: "/portal/widget-link",
  operationId: "getQuillsPortalWidgetLink",
  summary: "Whether a widget profile waits for the caller to link it",
  description:
    "pending is true when a widget profile with the signed-in account's verified email asked for a portal sign-in link (POST /widget/portal-link) in the last 15 minutes and can be linked. The portal then asks the person to confirm (POST) or refuse (DELETE). 404 while the portal is off.",
  action: "read",
  response: z.object({ pending: z.boolean() }),
  responseDescription: "Whether a link waits for the caller's answer",
  handler: async ({ db, caller }) => {
    await requirePortal(db);
    if (!eligible(caller)) return { pending: false };
    const request = requestOf(db, caller);
    const requested = await request.requested(false);
    return {
      pending: Boolean(requested && (await request.profile(requested))[0]),
    };
  },
});

const link = defineQuillsRoute({
  audience: "portal",
  method: "post",
  path: "/portal/widget-link",
  operationId: "linkQuillsPortalWidgetProfile",
  summary: "Link the caller's widget profile to their portal profile",
  description:
    "The person confirmed the link in the portal. When the signed-in account's email is verified and equals the email of a widget profile that the host app identified in this workspace, and that widget profile asked for a portal sign-in link (POST /widget/portal-link) in the last 15 minutes, the widget profile's votes, comments, conversations, tickets, survey answers, subscriptions and other activity move to the caller's portal profile in one transaction. A duplicate vote, rating or subscription is dropped and its count lowered, so counts do not grow; an opt-out on either profile wins. The widget profile is removed and its sub identifies the portal profile from then on. A blocked or test profile, an unverified email, a workspace member and a portal profile that an earlier link gave another sub are never linked. Each request links once. Without a match nothing changes. 404 while the portal is off.",
  action: "update",
  rateLimit: { limit: 30, windowSeconds: 600, per: "caller" },
  response: z.object({
    /** The caller's customer principal, or null without a profile here. */
    principalId: z.string().nullable(),
    /** The widget principal whose activity moved to the caller, or null. */
    mergedPrincipalId: z.string().nullable(),
  }),
  responseDescription:
    "The caller's profile and the widget profile it absorbed",
  event: (_input, result) =>
    Boolean(result.mergedPrincipalId) && {
      type: "user.lead_merged",
      entityType: "principal",
      entityId: result.principalId!,
      payload: { leadPrincipalId: result.mergedPrincipalId! },
    },
  handler: async ({ db, caller }) => {
    await requirePortal(db);
    const none = { principalId: caller.principalId, mergedPrincipalId: null };
    if (!eligible(caller)) return none;
    const request = requestOf(db, caller);
    const requested = await request.requested(true);
    if (!requested) return none;
    const [found] = await request.profile(requested);
    if (!found) return none;
    // identify.ts takes these locks in this order, so an identify of the same visitor waits for the link.
    for (const key of [`sub:${found.externalId}`, `email:${request.email}`])
      await db.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`quills-identify:${key}`}))`,
      );
    const [widget] = await request.profile(requested).for("update");
    // The lock covers the sub read before it; a profile whose sub changed meanwhile waits for the next call.
    if (!widget || widget.externalId !== found.externalId) return none;
    const portal = (await portalCaller(db, caller.account!, true))!;
    // Locked before repoint touches its principal, so a concurrent identify cannot deadlock with it.
    const [own] = await db
      .select({ externalId: customer.externalId, metadata: customer.metadata })
      .from(customer)
      .where(eq(customer.id, portal.customerId))
      .for("update");
    // An earlier link gave the profile another sub; replacing it would orphan that visitor.
    if (own?.externalId && own.externalId !== widget.externalId) return none;
    // The audit row of the change names the portal profile, created here when it was missing.
    caller.customerId = portal.customerId;
    caller.principalId = portal.principalId;
    await repoint(db, widget.principalId, portal.principalId!);
    // The profile delete cascades to the widget principal; its widget sessions stop resolving.
    await db.delete(customer).where(eq(customer.id, widget.customerId));
    await db
      .update(customer)
      .set({
        externalId: widget.externalId,
        email: request.email,
        emailVerified: true,
        // The portal profile's own attribute values win.
        metadata: mergeMetadata(widget.metadata, {
          set: parseMetadata(own?.metadata ?? null),
          remove: [],
        }),
      })
      .where(eq(customer.id, portal.customerId));
    await db.delete(kvStore).where(request.key);
    return {
      principalId: portal.principalId!,
      mergedPrincipalId: widget.principalId,
    };
  },
});

const decline = defineQuillsRoute({
  audience: "portal",
  method: "delete",
  path: "/portal/widget-link",
  operationId: "declineQuillsPortalWidgetLink",
  summary: "Refuse the link that a widget profile asked for",
  description:
    "The person did not ask to open the portal from the widget: the pending request for the signed-in account's email ends, and nothing is linked. 404 while the portal is off.",
  action: "update",
  rateLimit: { limit: 30, windowSeconds: 600, per: "caller" },
  response: z.object({ declined: z.boolean() }),
  responseDescription: "Whether a pending request ended",
  event: {
    none: "Removes a pending link request from kv_store; no customer record changes",
  },
  handler: async ({ db, caller }) => {
    await requirePortal(db);
    const ended = await db
      .delete(kvStore)
      .where(requestOf(db, caller).key)
      .returning({ key: kvStore.key });
    return { declined: ended.length > 0 };
  },
});

export default apiRouter()
  .openapi(...pendingLink)
  .openapi(...link)
  .openapi(...decline);
