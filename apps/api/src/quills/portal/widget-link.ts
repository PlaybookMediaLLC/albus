import { and, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";
import type { PrincipalId } from "@kaneo/ids";
import { apiRouter, z } from "../../openapi";
import { principal, user as customer } from "../../database/quills/schema/auth";
import { kvStore } from "../../database/quills/schema/kv";
import { defineQuillsRoute } from "../framework/define-route";
import { portalCaller } from "../framework/audience";
import { mergeMetadata, parseMetadata } from "../directory/customer";
import { repoint } from "../directory/lead-merge";
import { portalLinkKey } from "../widget/portal-link";
import { requirePortal } from "./feedback/viewer";

// Issue #129, option C: one customer, one history. A widget profile (named by the host app's
// signed token) that pressed "Open in portal" joins the caller's portal profile when the Kaneo
// account's verified email is the widget profile's email in this workspace. Mail proves the email;
// the host's token alone never reaches a Kaneo account. The widget's sub moves to the portal
// profile, so the next identify resolves there (widget/identify.ts).

const link = defineQuillsRoute({
  audience: "portal",
  method: "post",
  path: "/portal/widget-link",
  operationId: "linkQuillsPortalWidgetProfile",
  summary: "Link the caller's widget profile to their portal profile",
  description:
    "When the signed-in account's email is verified and equals the email of a widget profile that the host app identified in this workspace, and that widget profile asked for a portal sign-in link (POST /widget/portal-link) in the last 15 minutes, the widget profile's votes, comments, conversations, tickets, survey answers, subscriptions and other activity move to the caller's portal profile in one transaction. A duplicate vote or subscription is dropped and the post's vote count is lowered, so counts do not grow. The widget profile is removed and its sub identifies the portal profile from then on. A blocked or test profile, an unverified email, a workspace member and a portal profile that an earlier link gave another sub are never linked. Each request links once. Without a match nothing changes. 404 while the portal is off.",
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
    const account = caller.account!;
    const none = { principalId: caller.principalId, mergedPrincipalId: null };
    // A member's customer profile is left out of the people directory, so it would hide the history.
    if (!account.emailVerified || account.member) return none;
    const email = account.email.toLowerCase();
    // Only the widget profile that pressed "Open in portal" for this address, recently, is linked:
    // a host app's claim about an email never joins history on its own.
    const pendingKey = and(
      eq(kvStore.workspaceKey, "_"),
      eq(kvStore.key, portalLinkKey(email)),
    );
    const [pending] = await db
      .select({ value: kvStore.value })
      .from(kvStore)
      .where(and(pendingKey, gt(kvStore.expiresAt, sql`now()`)))
      .for("update");
    const requested = (pending?.value as { principalId?: unknown } | undefined)
      ?.principalId;
    if (typeof requested !== "string") return none;
    const widgetProfile = () =>
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
            eq(principal.id, requested as PrincipalId),
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
    const [found] = await widgetProfile();
    if (!found) return none;
    // identify.ts takes these locks in this order, so an identify of the same visitor waits for the link.
    for (const key of [`sub:${found.externalId}`, `email:${email}`])
      await db.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`quills-identify:${key}`}))`,
      );
    const [widget] = await widgetProfile().for("update");
    // The lock covers the sub read before it; a profile whose sub changed meanwhile waits for the next call.
    if (!widget || widget.externalId !== found.externalId) return none;
    const portal = (await portalCaller(db, account, true))!;
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
        email,
        emailVerified: true,
        // The portal profile's own attribute values win.
        metadata: mergeMetadata(widget.metadata, {
          set: parseMetadata(own?.metadata ?? null),
          remove: [],
        }),
      })
      .where(eq(customer.id, portal.customerId));
    await db.delete(kvStore).where(pendingKey);
    return {
      principalId: portal.principalId!,
      mergedPrincipalId: widget.principalId,
    };
  },
});

export default apiRouter().openapi(...link);
