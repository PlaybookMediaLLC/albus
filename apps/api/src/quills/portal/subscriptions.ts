import { and, eq, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { PostId } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z } from "../../openapi";
import { changelogSubscriptions } from "../../database/quills/schema/changelog-subscriptions";
import { postSubscriptions } from "../../database/quills/schema/notifications";
import { posts } from "../../database/quills/schema/posts";
import { principal } from "../../database/quills/schema/auth";
import type { QuillsCaller } from "../framework/audience";
import { defineQuillsRoute, type Database } from "../framework/define-route";
import { notFound as hidden } from "../feedback/visibility";
import {
  postVisible,
  viewerFor,
  visibleBoards,
  type Customer,
} from "./feedback/viewer";
import { unfollowPost } from "../delivery/post-subscriptions";
import { requirePortalAccess } from "./gate";

// A portal customer's own subscriptions: posts, the changelog and the status page. Each route
// changes only the caller's own row, so it records no outbox event (as the teammate twins in
// delivery/post-subscriptions.ts). Every route needs the portal on and the caller let in. The
// widget mounts the changelog routes too, for a visitor the host app identified.

const personal = {
  none: "The caller's own subscription; no shared record changes.",
};
const notFound = (what: string) =>
  new HTTPException(404, { message: `${what} not found` });

/**
 * 404 unless the caller may see the post on the portal: a published post that was not merged,
 * by the shared customer rule (board tier, board segments, project links, test customers).
 */
async function customerPost(
  db: Database,
  caller: QuillsCaller,
  postId: PostId,
) {
  const viewer = await viewerFor(db, "portal", caller);
  const boardIds = (await visibleBoards(db, viewer)).map((board) => board.id);
  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(
        eq(posts.id, postId),
        isNull(posts.canonicalPostId),
        eq(posts.moderationState, "published"),
        postVisible(viewer, boardIds),
      ),
    )
    .limit(1);
  if (!row) throw notFound("Post");
}

const postParams = z.object({ postId: flexibleToTypeIdSchema("post") });
const level = z.enum(["all", "status_only"]);
const mine = (postId: PostId, caller: QuillsCaller) =>
  and(
    eq(postSubscriptions.postId, postId),
    eq(postSubscriptions.principalId, caller.principalId!),
  );

const getPostSubscription = defineQuillsRoute({
  audience: "portal",
  signIn: false,
  method: "get",
  path: "/posts/{postId}/subscription",
  operationId: "getQuillsMyPostSubscription",
  summary: "Get the caller's subscription to a post",
  description: "level is none for a caller without a sign-in or a profile.",
  action: "read",
  params: postParams,
  response: z.object({ level: z.enum(["all", "status_only", "none"]) }),
  responseDescription: "The caller's subscription level",
  errors: { 403: "Portal access denied", 404: "Post or portal not found" },
  handler: async ({ db, caller, params }) => {
    await requirePortalAccess(db, caller);
    await customerPost(db, caller, params.postId);
    const [row] = caller.principalId
      ? await db
          .select({
            notifyComments: postSubscriptions.notifyComments,
            notifyStatusChanges: postSubscriptions.notifyStatusChanges,
          })
          .from(postSubscriptions)
          .where(mine(params.postId, caller))
      : [];
    return {
      level: !row?.notifyStatusChanges
        ? ("none" as const)
        : row.notifyComments
          ? ("all" as const)
          : ("status_only" as const),
    };
  },
});

const setPostSubscription = defineQuillsRoute({
  audience: "portal",
  ensureCustomer: true,
  method: "put",
  path: "/posts/{postId}/subscription",
  operationId: "setQuillsMyPostSubscription",
  summary: "Subscribe the caller to a post or change the level",
  action: "update",
  rateLimit: { limit: 60, windowSeconds: 600 },
  params: postParams,
  body: z.object({ level }),
  response: z.object({ level }),
  responseDescription: "The caller's subscription level",
  errors: { 403: "Portal access denied", 404: "Post or portal not found" },
  event: personal,
  handler: async ({ db, caller, params, body }) => {
    await requirePortalAccess(db, caller);
    await customerPost(db, caller, params.postId);
    const flags = {
      notifyComments: body.level === "all",
      notifyStatusChanges: true,
    };
    await db
      .insert(postSubscriptions)
      .values({
        postId: params.postId,
        principalId: caller.principalId!,
        reason: "manual",
        ...flags,
      })
      .onConflictDoUpdate({
        target: [
          postSubscriptions.workspaceId,
          postSubscriptions.postId,
          postSubscriptions.principalId,
        ],
        set: { ...flags, updatedAt: new Date() },
      });
    return { level: body.level };
  },
});

const deletePostSubscription = defineQuillsRoute({
  audience: "portal",
  method: "delete",
  path: "/posts/{postId}/subscription",
  operationId: "deleteQuillsMyPostSubscription",
  summary: "Unsubscribe the caller from a post",
  action: "update",
  params: postParams,
  response: z.object({ changed: z.boolean() }),
  responseDescription: "Whether the caller followed the post",
  errors: { 403: "Portal access denied", 404: "Post or portal not found" },
  event: personal,
  handler: async ({ db, caller, params }) => {
    await requirePortalAccess(db, caller);
    await customerPost(db, caller, params.postId);
    if (!caller.principalId) return { changed: false };
    return {
      changed: await unfollowPost(db, params.postId, caller.principalId),
    };
  },
});

const changelogSubscription = (caller: QuillsCaller) =>
  eq(changelogSubscriptions.principalId, caller.principalId!);

/**
 * The portal lets in a signed-in customer; the widget needs the widget on and the changelog
 * tab on, as its changelog reads do. Returns whether the caller is a known person: an anonymous
 * widget visitor has no address for updates.
 */
async function changelogCaller(
  db: Database,
  audience: Customer,
  caller: QuillsCaller,
) {
  if (audience === "portal") {
    await requirePortalAccess(db, caller);
    return !!caller.principalId;
  }
  const viewer = await viewerFor(db, "widget", caller);
  if (!viewer.tabs.changelog) throw hidden("Changelog");
  const [me] = caller.principalId
    ? await db
        .select({ type: principal.type })
        .from(principal)
        .where(eq(principal.id, caller.principalId))
    : [];
  return me?.type === "user";
}
const identifiedOnly = () =>
  new HTTPException(403, {
    message: "Only a visitor that the host app identified subscribes",
  });
const where = (audience: Customer) =>
  audience === "portal" ? "Portal" : "Widget or its changelog tab";

const getChangelogSubscription = (audience: Customer) =>
  defineQuillsRoute({
    audience,
    signIn: audience === "widget",
    method: "get",
    path:
      audience === "portal"
        ? "/changelog/subscription"
        : "/widget/changelog/subscription",
    operationId:
      audience === "portal"
        ? "getQuillsMyChangelogSubscription"
        : "getQuillsWidgetChangelogSubscription",
    summary: "Get the caller's changelog subscription",
    description:
      audience === "widget"
        ? "subscribed is false for an anonymous visitor."
        : undefined,
    action: "read",
    response: z.object({ subscribed: z.boolean() }),
    responseDescription: "Whether the caller hears about new changelog entries",
    errors: {
      403: "Portal access denied",
      404: `${where(audience)} not found`,
    },
    handler: async ({ db, caller }) => {
      const known = await changelogCaller(db, audience, caller);
      const [row] = known
        ? await db
            .select({ unsubscribedAt: changelogSubscriptions.unsubscribedAt })
            .from(changelogSubscriptions)
            .where(changelogSubscription(caller))
        : [];
      return { subscribed: Boolean(row && !row.unsubscribedAt) };
    },
  });

const subscribeChangelog = (audience: Customer) =>
  defineQuillsRoute({
    audience,
    ensureCustomer: audience === "portal",
    method: "put",
    path:
      audience === "portal"
        ? "/changelog/subscription"
        : "/widget/changelog/subscription",
    operationId:
      audience === "portal"
        ? "subscribeQuillsMyChangelog"
        : "subscribeQuillsWidgetChangelog",
    summary: "Subscribe the caller to the changelog",
    description: `An explicit subscribe also undoes an earlier unsubscribe.${audience === "widget" ? " Only a visitor that the host app identified, so updates reach their address." : ""}`,
    action: "update",
    rateLimit: { limit: 30, windowSeconds: 600 },
    response: z.object({ subscribed: z.boolean() }),
    responseDescription: "The caller is subscribed",
    errors: {
      403:
        audience === "portal"
          ? "Portal access denied"
          : "Portal access denied, or an anonymous visitor",
      404: `${where(audience)} not found`,
    },
    event: personal,
    handler: async ({ db, caller }) => {
      if (!(await changelogCaller(db, audience, caller)))
        throw identifiedOnly();
      await db
        .insert(changelogSubscriptions)
        .values({ principalId: caller.principalId!, source: "self_serve" })
        .onConflictDoUpdate({
          target: [
            changelogSubscriptions.workspaceId,
            changelogSubscriptions.principalId,
          ],
          set: { unsubscribedAt: null },
        });
      return { subscribed: true };
    },
  });

const unsubscribeChangelog = (audience: Customer) =>
  defineQuillsRoute({
    audience,
    signIn: audience === "widget",
    method: "delete",
    path:
      audience === "portal"
        ? "/changelog/subscription"
        : "/widget/changelog/subscription",
    operationId:
      audience === "portal"
        ? "unsubscribeQuillsMyChangelog"
        : "unsubscribeQuillsWidgetChangelog",
    summary: "Unsubscribe the caller from the changelog",
    description:
      "Keeps the row, so an import or auto-subscribe never subscribes the caller again.",
    action: "update",
    response: z.object({ changed: z.boolean() }),
    responseDescription: "Whether a subscription ended",
    errors: {
      403: "Portal access denied",
      404: `${where(audience)} not found`,
    },
    event: personal,
    handler: async ({ db, caller }) => {
      if (!(await changelogCaller(db, audience, caller)))
        return { changed: false };
      const rows = await db
        .update(changelogSubscriptions)
        .set({ unsubscribedAt: new Date() })
        .where(
          and(
            changelogSubscription(caller),
            isNull(changelogSubscriptions.unsubscribedAt),
          ),
        )
        .returning({ id: changelogSubscriptions.id });
      return { changed: rows.length > 0 };
    },
  });

/** The widget's changelog subscription, under /widget/changelog/subscription. */
export const widgetChangelogSubscription = () =>
  apiRouter()
    .openapi(...getChangelogSubscription("widget"))
    .openapi(...subscribeChangelog("widget"))
    .openapi(...unsubscribeChangelog("widget"));

export default apiRouter()
  .openapi(...getPostSubscription)
  .openapi(...setPostSubscription)
  .openapi(...deletePostSubscription)
  .openapi(...getChangelogSubscription("portal"))
  .openapi(...subscribeChangelog("portal"))
  .openapi(...unsubscribeChangelog("portal"));
