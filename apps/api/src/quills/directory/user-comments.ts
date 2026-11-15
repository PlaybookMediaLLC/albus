import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { TypeId } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import {
  apiRouter,
  pagingNumber,
  responseTimestamp,
  z,
  type BaseVariables,
} from "../../openapi";
import {
  postCommentReactions,
  postComments,
  posts,
} from "../../database/quills/schema/posts";
import { defineQuillsRoute } from "../framework/define-route";
import { loadProjects, notTest, visiblePost } from "../feedback/visibility";
import { loadCustomer } from "./customer";

/** The live comments of one person on posts that the caller can see. */
const visibleComments = (
  principalId: TypeId<"principal">,
  projects: string[],
): SQL =>
  and(
    eq(postComments.principalId, principalId),
    isNull(postComments.deletedAt),
    visiblePost(projects),
  )!;

const listUserComments = defineQuillsRoute({
  method: "get",
  path: "/users/{principalId}/comments",
  operationId: "listQuillsUserComments",
  summary: "List the comments of a customer, newest first",
  description:
    "Customers only. Leaves out deleted comments and comments on posts that the caller cannot see: deleted posts, test-customer posts and posts on hidden boards. `reactionCount` leaves out test customers.",
  action: "read",
  params: z.object({ principalId: flexibleToTypeIdSchema("principal") }),
  query: z.object({
    cursor: flexibleToTypeIdSchema("post_comment").optional(),
    limit: pagingNumber(1, 100, 20),
  }),
  response: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        postId: z.string(),
        postTitle: z.string(),
        content: z.string(),
        reactionCount: z.number(),
        createdAt: responseTimestamp,
      }),
    ),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
  responseDescription: "One page of comments",
  errors: { 404: "Person or comment not found" },
  load: loadProjects,
  handler: async ({ db, params, query, loaded: projects }) => {
    await loadCustomer(db, params.principalId);
    const where = visibleComments(params.principalId, projects);
    // A cursor is a comment of this list; any other one is 404, not a probe.
    if (query.cursor) {
      const [found] = await db
        .select({ id: postComments.id })
        .from(postComments)
        .innerJoin(posts, eq(posts.id, postComments.postId))
        .where(and(where, eq(postComments.id, query.cursor)))
        .limit(1);
      if (!found)
        throw new HTTPException(404, { message: "Comment not found" });
    }
    const rows = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        postTitle: posts.title,
        content: postComments.content,
        reactionCount: sql<number>`(select count(*)::int from ${postCommentReactions} r where r.comment_id = ${postComments.id} and ${notTest(sql`r.principal_id`)})`,
        createdAt: postComments.createdAt,
      })
      .from(postComments)
      .innerJoin(posts, eq(posts.id, postComments.postId))
      .where(
        and(
          where,
          query.cursor &&
            sql`(${postComments.createdAt}, ${postComments.id}) < (select cursor_comment.created_at, cursor_comment.id from ${postComments} cursor_comment where cursor_comment.id = ${sql.param(query.cursor, postComments.id)})`,
        ),
      )
      .orderBy(desc(postComments.createdAt), desc(postComments.id))
      .limit(query.limit + 1);
    const hasMore = rows.length > query.limit;
    const items = rows
      .slice(0, query.limit)
      .map((row) => ({ ...row, reactionCount: Number(row.reactionCount) }));
    return { items, nextCursor: hasMore ? items.at(-1)!.id : null, hasMore };
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>().openapi(
  ...listUserComments,
);
