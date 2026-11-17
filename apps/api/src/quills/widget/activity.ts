import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, responseTimestamp, z } from "../../openapi";
import { inAppNotifications } from "../../database/quills/schema/notifications";
import { posts } from "../../database/quills/schema/posts";
import { postStatuses } from "../../database/quills/schema/statuses";
import { defineQuillsRoute, type Database } from "../framework/define-route";
import {
  postVisible,
  principalOf,
  stageOf,
  viewerFor,
  visibleBoards,
  type Viewer,
} from "../portal/feedback/viewer";

// The identified visitor's own activity on requests they follow (RFC 0005): replies and status
// changes, from the in-app notifications that the job worker writes. Each read rechecks that the
// visitor can still see the request, so a post that became private drops out of the feed.

const LIMIT = 50;
const item = z.object({
  id: z.string(),
  postId: z.string(),
  title: z.string(),
  kind: z.enum(["reply", "status", "shipped"]),
  summary: z.string(),
  createdAt: responseTimestamp,
  unread: z.boolean(),
});

/** The caller's live notifications on posts that the caller can still see. */
async function visible(db: Database, viewer: Viewer) {
  const boards = await visibleBoards(db, viewer);
  return and(
    eq(inAppNotifications.principalId, principalOf(viewer)),
    isNull(inAppNotifications.archivedAt),
    postVisible(
      viewer,
      boards.map((board) => board.id),
    ),
  )!;
}
/** Newest first, at most 50; `ids` narrows to those items. */
async function visibleActivity(db: Database, viewer: Viewer, ids?: string[]) {
  return db
    .select({
      id: inAppNotifications.id,
      postId: inAppNotifications.postId,
      type: inAppNotifications.type,
      title: inAppNotifications.title,
      body: inAppNotifications.body,
      readAt: inAppNotifications.readAt,
      createdAt: inAppNotifications.createdAt,
      postTitle: posts.title,
      statusSlug: postStatuses.slug,
      statusCategory: postStatuses.category,
    })
    .from(inAppNotifications)
    .innerJoin(posts, eq(posts.id, inAppNotifications.postId))
    .leftJoin(postStatuses, eq(postStatuses.id, posts.statusId))
    .where(
      and(
        await visible(db, viewer),
        ...(ids ? [inArray(inAppNotifications.id, ids as never)] : []),
      ),
    )
    .orderBy(desc(inAppNotifications.createdAt), desc(inAppNotifications.id))
    .limit(LIMIT);
}
type Row = Awaited<ReturnType<typeof visibleActivity>>[number];
const toItem = (row: Row): z.infer<typeof item> => ({
  id: row.id,
  postId: row.postId!,
  title: row.postTitle,
  kind:
    row.type === "comment_created"
      ? "reply"
      : stageOf(
            row.statusCategory
              ? { slug: row.statusSlug!, category: row.statusCategory }
              : null,
          ) === "shipped"
        ? "shipped"
        : "status",
  summary: row.body ?? row.title,
  createdAt: row.createdAt,
  unread: row.readAt === null,
});
async function unreadCount(db: Database, viewer: Viewer) {
  const [row] = await db
    .select({ n: count() })
    .from(inAppNotifications)
    .innerJoin(posts, eq(posts.id, inAppNotifications.postId))
    .where(and(await visible(db, viewer), isNull(inAppNotifications.readAt)));
  return row?.n ?? 0;
}

const listActivity = defineQuillsRoute({
  audience: "widget",
  method: "get",
  path: "/widget/activity",
  operationId: "listQuillsWidgetActivity",
  summary: "List the visitor's activity on requests they follow",
  description:
    "Replies and status changes on requests that the identified visitor follows, newest first, at most 50. Only requests the visitor can still see are listed.",
  action: "read",
  response: z.object({ items: z.array(item), unreadCount: z.number() }),
  responseDescription: "The visitor's activity",
  handler: async ({ db, caller }) => {
    const viewer = await viewerFor(db, "widget", caller);
    if (!viewer.principalId) return { items: [], unreadCount: 0 };
    const rows = await visibleActivity(db, viewer);
    return {
      items: rows.map(toItem),
      unreadCount: await unreadCount(db, viewer),
    };
  },
});

const readActivity = defineQuillsRoute({
  audience: "widget",
  method: "put",
  path: "/widget/activity/{activityId}/read",
  operationId: "markQuillsWidgetActivityRead",
  summary: "Mark one activity item read",
  description:
    "Idempotent. Only the visitor's own item on a request they can still see.",
  action: "update",
  rateLimit: { limit: 300, windowSeconds: 600 },
  params: z.object({ activityId: flexibleToTypeIdSchema("notification") }),
  response: z.object({ item, unreadCount: z.number() }),
  responseDescription: "The item and the visitor's unread count",
  errors: { 404: "Activity not found" },
  event: { none: "The caller's own read mark; no shared record changes" },
  handler: async ({ db, caller, params }) => {
    const viewer = await viewerFor(db, "widget", caller);
    if (!viewer.principalId)
      throw new HTTPException(404, { message: "Activity not found" });
    const [row] = await visibleActivity(db, viewer, [params.activityId]);
    if (!row) throw new HTTPException(404, { message: "Activity not found" });
    if (!row.readAt)
      await db
        .update(inAppNotifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(inAppNotifications.id, row.id),
            eq(inAppNotifications.principalId, principalOf(viewer)),
          ),
        );
    return {
      item: { ...toItem(row), unread: false },
      unreadCount: await unreadCount(db, viewer),
    };
  },
});

export default apiRouter()
  .openapi(...listActivity)
  .openapi(...readActivity);
