import { and, eq, inArray, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { isTypeId, type PostId, type TypeId } from "@kaneo/ids";
import { typeIdSchema } from "@kaneo/ids/zod";
import {
  withQuillsSystemWorkspace,
  type Database,
} from "../../database/quills/client";
import { principal } from "../../database/quills/schema/auth";
import { boards } from "../../database/quills/schema/boards";
import type { JobQueueRow } from "../../database/quills/schema/job-queue";
import { postTasks } from "../../database/quills/schema/platform-links";
import { posts } from "../../database/quills/schema/posts";
import { postStatuses } from "../../database/quills/schema/statuses";
import { recordQuillsChange } from "../events";
import { recordActivity } from "../feedback/activity";
import {
  accessibleProjectIds,
  assignable,
  linkedTasks,
  recentTaskWithMarker,
  taskTarget,
  teammateHolds,
  teammateMayAct,
  type TaskFailure,
} from "../framework/platform-reads";
import {
  commentOnKaneoTask,
  createKaneoTask,
  deleteKaneoTask,
} from "../framework/platform-writes";
import type { DeliveryEvent } from "../jobs/fanout";
import { claimDelivery, reclaimVerified, settleDelivery } from "../jobs/ledger";
import { enqueueQuillsJob, finishQuillsJob } from "../jobs/queue";
import { portalPaths } from "../portal/paths";
import { deliveryOf, linkCreatedTask, taskDraft } from "./post-task";

// The board task rule (RFC 0005, phase 2, section 5.2, decisions 2 and 3). A teammate's status change
// commits with its `post.status_changed` outbox event. The fan-out (taskRuleDue) then enqueues:
// - "create" when the request entered the board's trigger status: the job creates the Kaneo task as
//   that teammate, through Kaneo's controller, and links it;
// - "comment" when the request moved back and links tasks: the job comments on each task as that
//   teammate. Quills never deletes, archives or moves Kaneo work.
// A change without a teammate (a task sync, an integration) does neither.

export const taskRulePayloadSchema = z
  .object({
    rule: z.enum(["create", "comment"]),
    eventId: z.string().min(1).max(200),
    postId: typeIdSchema("post"),
    principalId: typeIdSchema("principal"),
    statusId: typeIdSchema("post_status"),
    /** The task actions that the change's scoped API key allows; absent without a key. */
    keyTasks: z.string().max(40).optional(),
  })
  .strict();
type Payload = z.output<typeof taskRulePayloadSchema>;
/** The change came with a scoped API key that does not allow this task action. */
const keyDenies = (payload: Payload, action: "create" | "update") =>
  payload.keyTasks !== undefined &&
  !payload.keyTasks.split(",").includes(action);

/** True when the request moved back: to a closed status, from complete to active, or to an earlier active one. */
async function movedBack(db: Database, fromId: string, toId: string) {
  if (!isTypeId(fromId, "post_status") || !isTypeId(toId, "post_status"))
    return false;
  const rows = await db
    .select({
      id: postStatuses.id,
      category: postStatuses.category,
      position: postStatuses.position,
    })
    .from(postStatuses)
    .where(inArray(postStatuses.id, [fromId, toId] as TypeId<"post_status">[]));
  const from = rows.find((row) => row.id === fromId);
  const to = rows.find((row) => row.id === toId);
  if (!from || !to) return false;
  if (to.category === "closed") return from.category !== "closed";
  if (from.category === "complete") return to.category === "active";
  return (
    from.category === "active" &&
    to.category === "active" &&
    to.position < from.position
  );
}

/**
 * Fan-out step for `post.status_changed`: enqueues the rule's jobs, after the status change committed.
 * A teammate's change only; a status set again to the same value does nothing.
 */
export async function taskRuleDue(db: Database, event: DeliveryEvent) {
  if (
    event.type !== "post.status_changed" ||
    event.actorType !== "user" ||
    !event.actorId
  )
    return;
  const payload = event.payload as Record<string, string | undefined>;
  const { statusId, previousStatusId, keyTasks } = payload;
  if (payload.source || !statusId || statusId === previousStatusId) return;
  const [post] = await db
    .select({ settings: boards.settings })
    .from(posts)
    .innerJoin(boards, eq(boards.id, posts.boardId))
    .where(
      and(
        eq(posts.id, event.entityId as PostId),
        isNull(posts.deletedAt),
        isNull(boards.deletedAt),
      ),
    );
  if (!post) return;
  const job = (rule: Payload["rule"]) =>
    enqueueQuillsJob(
      db,
      "quills.workflow",
      {
        rule,
        eventId: event.eventId,
        postId: event.entityId,
        principalId: event.actorId!,
        statusId,
        ...(keyTasks !== undefined && { keyTasks }),
      },
      `task-rule:${rule}:${event.eventId}`,
      3,
    );
  if (deliveryOf(post.settings)?.triggerStatusId === statusId)
    await job("create");
  if (previousStatusId && (await movedBack(db, previousStatusId, statusId))) {
    const [link] = await db
      .select({ taskId: postTasks.taskId })
      .from(postTasks)
      .where(eq(postTasks.postId, event.entityId as PostId))
      .limit(1);
    if (link) await job("comment");
  }
}

/** The acting teammate's Kaneo user and name, the live request and its links. */
async function readRequest(workspaceId: string, payload: Payload) {
  return withQuillsSystemWorkspace(workspaceId, async (db) => {
    const [actor] = await db
      .select({ userId: principal.kaneoUserId, name: principal.displayName })
      .from(principal)
      .where(eq(principal.id, payload.principalId));
    const [post] = await db
      .select({
        title: posts.title,
        statusId: posts.statusId,
        settings: boards.settings,
        status: postStatuses.name,
      })
      .from(posts)
      .innerJoin(boards, eq(boards.id, posts.boardId))
      .leftJoin(postStatuses, eq(postStatuses.id, posts.statusId))
      .where(
        and(
          eq(posts.id, payload.postId),
          isNull(posts.deletedAt),
          isNull(boards.deletedAt),
        ),
      );
    const links = await db
      .select({ taskId: postTasks.taskId })
      .from(postTasks)
      .where(eq(postTasks.postId, payload.postId))
      .limit(100);
    return {
      userId: actor?.userId ?? null,
      post,
      taskIds: links.map((link) => link.taskId),
    };
  });
}

/** Notes why no task was created on the request, and tells the teammate in-app (fanout entry below). */
async function recordFailure(
  db: Database,
  payload: Payload,
  reason: TaskFailure,
) {
  await recordActivity(
    db,
    { principalId: payload.principalId },
    payload.postId,
    {
      type: "task.create_failed",
      metadata: { reason },
    },
  );
  // No actor: the fan-out never tells a change's actor, and this one is for the teammate who acted.
  await recordQuillsChange(db, null, {
    type: "post.task_create_failed",
    entityType: "post",
    entityId: payload.postId,
    payload: { principalId: payload.principalId, reason },
  });
}

async function finish(workspaceId: string, job: JobQueueRow) {
  await withQuillsSystemWorkspace(workspaceId, (db) =>
    finishQuillsJob(db, job.id, job.leaseToken!),
  );
}

async function createFromRule(
  workspaceId: string,
  job: JobQueueRow,
  payload: Payload,
) {
  const { userId, post, taskIds } = await readRequest(workspaceId, payload);
  const delivery = post && deliveryOf(post.settings);
  // The rule changed, the request moved on or was deleted, or the actor is no teammate: nothing to do.
  if (
    !userId ||
    !delivery ||
    delivery.triggerStatusId !== payload.statusId ||
    post.statusId !== payload.statusId
  )
    return finish(workspaceId, job);
  // A request that already links a task in the delivery project gets no second task.
  const linked = await linkedTasks(workspaceId, userId, taskIds);
  if (linked.items.some((task) => task.projectId === delivery.projectId))
    return finish(workspaceId, job);
  const projects = await accessibleProjectIds(workspaceId, userId);
  const target =
    !keyDenies(payload, "create") &&
    (await teammateMayAct(workspaceId, userId, "update"))
      ? await taskTarget(
          workspaceId,
          userId,
          delivery.projectId,
          delivery.columnId,
        )
      : ({ reason: "forbidden" } as const);
  const draft = await withQuillsSystemWorkspace(workspaceId, (db) =>
    taskDraft(db, payload.postId, projects),
  );
  // One task per request and project, across retries and repeated moves.
  const key = `task-rule:${payload.postId}:${delivery.projectId}`;
  if (!draft || "reason" in target)
    return withQuillsSystemWorkspace(workspaceId, async (db) => {
      if (draft && "reason" in target)
        await recordFailure(db, payload, target.reason);
      await finishQuillsJob(db, job.id, job.leaseToken!);
    });
  const claim = await withQuillsSystemWorkspace(workspaceId, (db) =>
    claimDelivery(db, key, "task_rule"),
  );
  if (claim === "completed") return finish(workspaceId, job);
  // An earlier attempt stopped after Kaneo may have created the task: link the task that Kaneo has
  // (its description links the request), or create it when Kaneo has none.
  const found =
    claim === "uncertain"
      ? await recentTaskWithMarker(
          workspaceId,
          delivery.projectId,
          portalPaths.teammatePost(workspaceId, payload.postId),
        )
      : undefined;
  if (
    claim === "uncertain" &&
    !(await withQuillsSystemWorkspace(workspaceId, (db) =>
      reclaimVerified(db, key),
    ))
  )
    return finish(workspaceId, job);
  let task: { id: string };
  if (found) task = { id: found };
  else
    try {
      const owner = draft.ownerUserId;
      task = await createKaneoTask({
        userId,
        projectId: delivery.projectId,
        status: target.status,
        title: draft.title,
        description: draft.description,
        priority: delivery.priority,
        assigneeId:
          owner && (await assignable(workspaceId, delivery.projectId, owner))
            ? owner
            : undefined,
        dueDate: draft.dueDate,
      });
    } catch (error) {
      // Kaneo commits the task in one transaction before anything that can throw after it, so a
      // throw means no task. A refusal (4xx) or the last attempt is final and told to the teammate.
      const final =
        (error instanceof HTTPException && error.status < 500) ||
        job.attempts >= job.maxAttempts;
      await withQuillsSystemWorkspace(workspaceId, async (db) => {
        await settleDelivery(db, key, "failed");
        if (final) {
          await recordFailure(db, payload, "failed");
          await finishQuillsJob(db, job.id, job.leaseToken!);
        }
      });
      if (final) return;
      throw error;
    }
  let done: boolean;
  try {
    done = await withQuillsSystemWorkspace(workspaceId, async (db) => {
      const ok = await linkCreatedTask(
        db,
        payload,
        payload.postId,
        task.id,
        "rule",
      );
      if (ok)
        await recordQuillsChange(
          db,
          { principalId: payload.principalId },
          {
            type: "post.task_linked",
            entityType: "post",
            entityId: payload.postId,
            payload: { taskId: task.id, source: "rule" },
          },
        );
      await settleDelivery(db, key, ok ? "completed" : "failed");
      await finishQuillsJob(db, job.id, job.leaseToken!);
      return ok;
    });
  } catch (error) {
    // The link did not commit: remove the new task so a retry does not leave two.
    await deleteKaneoTask(task.id, userId);
    await withQuillsSystemWorkspace(workspaceId, (db) =>
      settleDelivery(db, key, "failed"),
    );
    throw error;
  }
  // The request was deleted after the read: the new task must not stay unlinked.
  if (!done) await deleteKaneoTask(task.id, userId);
}

/** Decision 3: the task stays, and each linked task the teammate may update gets one comment. */
async function commentMovedBack(
  workspaceId: string,
  job: JobQueueRow,
  payload: Payload,
) {
  const { userId, post, taskIds } = await readRequest(workspaceId, payload);
  if (
    !userId ||
    !post?.status ||
    post.statusId !== payload.statusId ||
    keyDenies(payload, "update") ||
    !(await teammateHolds(workspaceId, userId, { task: ["update"] }))
  )
    return finish(workspaceId, job);
  // Only tasks in projects the teammate can open.
  const { items } = await linkedTasks(workspaceId, userId, taskIds);
  const url = portalPaths.teammatePost(workspaceId, payload.postId);
  const title = post.title.replace(/[[\]]/g, "");
  for (const task of items) {
    const key = `task-comment:${payload.eventId}:${task.taskId}`;
    const claim = await withQuillsSystemWorkspace(workspaceId, (db) =>
      claimDelivery(db, key, "task_comment"),
    );
    if (claim !== "send") continue;
    await commentOnKaneoTask(
      task.taskId,
      userId,
      `The feedback request [${title}](${url}) moved back to **${post.status}**. This task stays as it is; change it here if the plan changed.`,
    );
    await withQuillsSystemWorkspace(workspaceId, (db) =>
      settleDelivery(db, key, "completed"),
    );
  }
  await finish(workspaceId, job);
}

/** `quills.workflow` job of the board task rule. */
export async function runTaskRuleJob(workspaceId: string, job: JobQueueRow) {
  const payload = taskRulePayloadSchema.parse(job.payload);
  return payload.rule === "create"
    ? createFromRule(workspaceId, job, payload)
    : commentMovedBack(workspaceId, job, payload);
}
