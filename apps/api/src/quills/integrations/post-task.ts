// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { isTypeId, type TypeId } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { z } from "../../openapi";
import { principal } from "../../database/quills/schema/auth";
import { boards } from "../../database/quills/schema/boards";
import { postExternalLinks } from "../../database/quills/schema/external-links";
import { postTasks } from "../../database/quills/schema/platform-links";
import { posts, postVotes } from "../../database/quills/schema/posts";
import { segments, userSegments } from "../../database/quills/schema/segments";
import type { Database, QuillsActor } from "../framework/define-route";
import type { TaskFailure } from "../framework/platform-reads";
import { recordActivity } from "../feedback/activity";
import { demandOf } from "../feedback/demand";
import { boardVisible } from "../feedback/visibility";
import { portalPaths } from "../portal/paths";

// Requests become Kaneo tasks (RFC 0005, phases 1 and 2). This module holds the board's delivery
// settings, the task that a request becomes, and the link write. The route (feedback/post-tasks.ts)
// and the rule job (task-rule-job.ts) call Kaneo's createTask between the read and the link write.

/** Kaneo's task priorities. Kaneo's createTask controller does not check the value, so Quills does. */
export const TASK_PRIORITIES = [
  "no-priority",
  "low",
  "medium",
  "high",
  "urgent",
] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
const priority = z.enum(TASK_PRIORITIES);

export const deliveryInput = z.object({
  projectId: z.string().min(1).max(200).openapi({
    description:
      "The Kaneo project that receives the board's tasks. It does not change who sees the board.",
  }),
  columnId: z.string().min(1).max(200).nullable().openapi({
    description:
      "The column of new tasks. Null: the project's first column that is not final.",
  }),
  priority: priority.openapi({ description: "The priority of new tasks." }),
  triggerStatusId: flexibleToTypeIdSchema("post_status").nullable().openapi({
    description:
      "When a teammate moves a request of this board to this status, a task is created as that teammate. Null: the rule is off.",
  }),
});
export const deliveryView = z
  .object({
    projectId: z.string(),
    columnId: z.string().nullable(),
    priority,
    triggerStatusId: z.string().nullable(),
  })
  .nullable()
  .openapi({ description: "Null: the board has no delivery project." });
export type Delivery = NonNullable<z.output<typeof deliveryView>>;

/** The stored delivery settings, or null when the board has none or they do not parse. */
export function deliveryOf(settings: unknown): Delivery | null {
  const value = (settings as { delivery?: unknown } | null)?.delivery as
    | Record<string, unknown>
    | undefined;
  if (!value || typeof value.projectId !== "string") return null;
  const trigger = value.triggerStatusId;
  return {
    projectId: value.projectId,
    columnId: typeof value.columnId === "string" ? value.columnId : null,
    priority: priority.safeParse(value.priority).data ?? "medium",
    triggerStatusId:
      typeof trigger === "string" && isTypeId(trigger, "post_status")
        ? trigger
        : null,
  };
}

/** The API message of each reason why no task was created. */
export const taskFailureMessages: Record<TaskFailure, string> = {
  forbidden: "You cannot create tasks in this project",
  archived: "The project is archived",
  column_missing: "The column does not exist in the project",
  plan: "The workspace plan does not include task creation",
  failed: "Kaneo did not create the task",
};

const clip = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1)}…` : text;
const TITLE_MAX = 500;
const CONTENT_MAX = 4000;

/**
 * The task description (RFC 0005, 5.3): the request text, a link back to the teammate app and the demand
 * counts. It names no customer: Kaneo project members do not need personal data, and the link shows it to
 * those who may see it.
 */
export function taskDescription(input: {
  content: string;
  url: string;
  title: string;
  voters: number;
  companies: number;
  segments: { name: string; voters: number }[];
  conversations: number;
}) {
  const content = clip(input.content.trim(), CONTENT_MAX);
  return [
    // A blank line before the rule: "text\n---" would make the request text a heading.
    ...(content ? [content, ""] : []),
    "---",
    "",
    `**Feedback request:** [${input.title.replace(/[[\]]/g, "")}](${input.url})`,
    "",
    `- Votes: ${input.voters} · Companies: ${input.companies}`,
    ...(input.segments.length
      ? [
          `- Top segments: ${input.segments.map((s) => `${s.name} (${s.voters})`).join(", ")}`,
        ]
      : []),
    `- Linked conversations: ${input.conversations}`,
  ].join("\n");
}

/**
 * What the request's task contains (RFC 0005, 5.3), read in the request's scoped transaction. 404 for a
 * missing post or one on a board that the teammate cannot see (`projects`: their open projects).
 */
export async function taskDraft(
  db: Database,
  postId: TypeId<"post">,
  projects: string[],
) {
  const [post] = await db
    .select({
      id: posts.id,
      workspaceId: posts.workspaceId,
      title: posts.title,
      content: posts.content,
      eta: posts.eta,
      settings: boards.settings,
      ownerUserId: principal.kaneoUserId,
    })
    .from(posts)
    .innerJoin(boards, eq(boards.id, posts.boardId))
    .leftJoin(principal, eq(principal.id, posts.ownerPrincipalId))
    .where(
      and(
        eq(posts.id, postId),
        isNull(posts.deletedAt),
        boardVisible(projects),
      ),
    )
    .limit(1);
  if (!post) return undefined;
  // No revenue: every member of the Kaneo project reads the task, with or without quills:view_revenue.
  const demand = (await demandOf(db, [post.id], projects, false))(post.id);
  const voters = sql<number>`count(distinct ${postVotes.principalId})::int`;
  const top = await db
    .select({ name: segments.name, voters })
    .from(postVotes)
    .innerJoin(
      userSegments,
      eq(userSegments.principalId, postVotes.principalId),
    )
    .innerJoin(segments, eq(segments.id, userSegments.segmentId))
    .where(and(eq(postVotes.postId, post.id), isNull(segments.deletedAt)))
    .groupBy(segments.id, segments.name)
    .orderBy(desc(voters), segments.name)
    .limit(3);
  const [conversations] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postExternalLinks)
    .where(
      and(
        eq(postExternalLinks.postId, post.id),
        eq(postExternalLinks.integrationType, "live_chat"),
        eq(postExternalLinks.status, "active"),
      ),
    );
  const title = clip(post.title.trim(), TITLE_MAX);
  return {
    title,
    description: taskDescription({
      content: post.content,
      url: portalPaths.teammatePost(post.workspaceId, post.id),
      title,
      voters: demand.voters,
      companies: demand.companies,
      segments: top,
      conversations: conversations?.count ?? 0,
    }),
    dueDate: post.eta ?? undefined,
    ownerUserId: post.ownerUserId ?? undefined,
    delivery: deliveryOf(post.settings),
  };
}
export type TaskDraft = NonNullable<Awaited<ReturnType<typeof taskDraft>>>;

/**
 * Links the created task to the live request and notes it in the request activity, in the caller's
 * transaction. False when the request is gone (deleted since the read) or already links the task.
 */
export async function linkCreatedTask(
  db: Database,
  actor: Pick<QuillsActor, "principalId">,
  postId: TypeId<"post">,
  taskId: string,
  source: "manual" | "rule",
) {
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .for("update");
  if (!post) return false;
  const [row] = await db
    .insert(postTasks)
    .values({ postId, taskId, source })
    .onConflictDoNothing()
    .returning({ postId: postTasks.postId });
  if (!row) return false;
  await recordActivity(db, actor, postId, {
    type: "task.created",
    metadata: { source },
  });
  return true;
}
