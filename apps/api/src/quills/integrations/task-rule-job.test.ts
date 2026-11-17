import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { and, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PostStatusId, PrincipalId } from "@kaneo/ids";
import * as kaneo from "../../database/schema";
import { postActivity } from "../../database/quills/schema/activity";
import { boards } from "../../database/quills/schema/boards";
import { events } from "../../database/quills/schema/events";
import { hookDeliveries } from "../../database/quills/schema/hook-deliveries";
import { jobQueue } from "../../database/quills/schema/job-queue";
import { inAppNotifications } from "../../database/quills/schema/notifications";
import { postTasks } from "../../database/quills/schema/platform-links";
import { posts } from "../../database/quills/schema/posts";
import { postStatuses } from "../../database/quills/schema/statuses";
import { harness } from "../jobs/handlers/harness.fixture";
import { portalPaths } from "../portal/paths";

let pool: Pool;
vi.mock("../../database/index", () => ({
  getDatabasePool: () => pool,
  get schema() {
    return kaneo;
  },
  default: new Proxy(
    {},
    {
      get(_target, property) {
        const db = drizzle(pool, { schema: kaneo });
        const value = Reflect.get(db, property);
        return typeof value === "function" ? value.bind(db) : value;
      },
    },
  ),
}));
vi.mock("../../ws", () => ({
  broadcastToUserAndWait: vi.fn(async () => {}),
}));
// The request disappears between the job's read and its link write, on demand.
let goneBeforeLink = false;
vi.mock("./post-task", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./post-task")>();
  return {
    ...actual,
    linkCreatedTask: async (
      ...args: Parameters<typeof actual.linkCreatedTask>
    ) => (goneBeforeLink ? false : actual.linkCreatedTask(...args)),
  };
});

const url = process.env.QUILLS_TEST_DATABASE_URL;
const h = harness("taskrule");
const triage = `${h.a}_triage`;
let planned: PostStatusId;
let open: PostStatusId;
let seq = 0;

/** A Kaneo project with a to-do and a final done column. */
async function project(workspaceId: string, archived = false) {
  const id = `${h.a}_project_${++seq}`;
  await h
    .db()
    .insert(kaneo.projectTable)
    .values({
      id,
      workspaceId,
      name: id,
      slug: `P${seq}`,
      archivedAt: archived ? new Date() : null,
    });
  await h
    .db()
    .insert(kaneo.columnTable)
    .values([
      { projectId: id, name: "To do", slug: "to-do", position: 0 },
      { projectId: id, name: "Done", slug: "done", position: 1, isFinal: true },
    ]);
  return id;
}
const tasksIn = (projectId: string) =>
  h
    .db()
    .select()
    .from(kaneo.taskTable)
    .where(eq(kaneo.taskTable.projectId, projectId));

/** A board that delivers to the project when its requests enter Planned, and an open request on it. */
async function request(projectId: string) {
  const author = await h.principal(h.a, h.mate);
  return h.system(h.a, async (db) => {
    const [board] = await db
      .insert(boards)
      .values({
        name: "Ideas",
        slug: `ideas-${++seq}`,
        settings: {
          delivery: {
            projectId,
            columnId: null,
            priority: "high",
            triggerStatusId: planned,
          },
        } as never,
      })
      .returning({ id: boards.id });
    const [row] = await db
      .insert(posts)
      .values({
        title: "Dark mode",
        content: "Please add a dark theme.",
        boardId: board!.id,
        principalId: author,
        statusId: open,
      })
      .returning({ id: posts.id });
    return row!.id;
  });
}

/** What setQuillsPostStatus commits: the new status and its outbox event, by the teammate. */
async function move(
  postId: string,
  from: PostStatusId,
  to: PostStatusId,
  actorId: PrincipalId | undefined,
  extra: Record<string, string> = {},
) {
  await h.system(h.a, (db) =>
    db
      .update(posts)
      .set({ statusId: to })
      .where(eq(posts.id, postId as never)),
  );
  await h.emit(h.a, {
    type: "post.status_changed",
    entityType: "post",
    entityId: postId,
    actorId,
    payload: { statusId: to, previousStatusId: from, ...extra },
  });
  // The event's fan-out enqueues the rule job; the next passes run it and its own events.
  for (let pass = 0; pass < 3; pass++) await h.drain(h.a);
}
const activity = (postId: string) =>
  h.system(h.a, (db) =>
    db
      .select({ type: postActivity.type, metadata: postActivity.metadata })
      .from(postActivity)
      .where(eq(postActivity.postId, postId as never)),
  );
const links = (postId: string) =>
  h.system(h.a, (db) =>
    db
      .select({ taskId: postTasks.taskId, source: postTasks.source })
      .from(postTasks)
      .where(eq(postTasks.postId, postId as never)),
  );

describe.skipIf(!url)("Quills board task rule", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 6 });
    await h.start(pool, url!);
    const ids = await h.system(h.a, async (db) =>
      Promise.all(
        ["planned", "open"].map(
          async (slug) =>
            (
              await db
                .select({ id: postStatuses.id })
                .from(postStatuses)
                .where(eq(postStatuses.slug, slug))
            )[0]!.id,
        ),
      ),
    );
    planned = ids[0]!;
    open = ids[1]!;
    // A teammate who may update requests but holds no Kaneo task:create.
    await h
      .db()
      .insert(kaneo.userTable)
      .values({ id: triage, name: triage, email: `${triage}@example.test` });
    await h
      .db()
      .insert(kaneo.workspaceRoleTable)
      .values({
        workspaceId: h.a,
        role: "triage",
        permission: JSON.stringify({
          workspace: ["read"],
          project: ["read"],
          task: ["read"],
          quills: ["read", "update"],
        }),
        createdAt: new Date(),
      });
    await h.db().insert(kaneo.workspaceUserTable).values({
      workspaceId: h.a,
      userId: triage,
      role: "triage",
      joinedAt: new Date(),
    });
  }, 120000);
  afterAll(async () => {
    await h.stop();
    await h.db().delete(kaneo.userTable).where(eq(kaneo.userTable.id, triage));
    await pool?.end();
  });
  beforeEach(async () => {
    await h.drain(h.a);
  });

  it("creates one task as the teammate in the delivery project, across repeated moves and a lost link", async () => {
    const projectId = await project(h.a);
    const postId = await request(projectId);
    const owner = await h.principal(h.a, h.owner);

    await move(postId, open, planned, owner);
    const [task, ...more] = await tasksIn(projectId);
    expect(more).toEqual([]);
    expect(task).toMatchObject({
      title: "Dark mode",
      status: "to-do",
      priority: "high",
      number: 1,
    });
    expect(task!.description).toContain("Please add a dark theme.");
    expect(task!.description).toContain(`/feedback/${h.a}/posts/${postId}`);
    expect(task!.description).toContain("Votes: 0");
    // No customer name or address in Kaneo.
    expect(task!.description).not.toContain(h.mate);
    expect(await links(postId)).toEqual([{ taskId: task!.id, source: "rule" }]);
    expect(await activity(postId)).toEqual([
      { type: "task.created", metadata: { source: "rule" } },
    ]);
    const [linked] = await h.system(h.a, (db) =>
      db
        .select({ payload: events.payload, actorId: events.actorId })
        .from(events)
        .where(
          and(eq(events.type, "post.task_linked"), eq(events.entityId, postId)),
        ),
    );
    expect(linked).toEqual({
      payload: { taskId: task!.id, source: "rule" },
      actorId: owner,
    });
    // A second move into Planned links nothing new.
    await move(postId, planned, open, owner);
    await move(postId, open, planned, owner);
    expect(await tasksIn(projectId)).toHaveLength(1);

    // Even with the link gone, the ledger keeps the rule from a second task for this request.
    await h.system(h.a, (db) =>
      db.delete(postTasks).where(eq(postTasks.postId, postId as never)),
    );
    await move(postId, planned, open, owner);
    await move(postId, open, planned, owner);
    expect(await tasksIn(projectId)).toHaveLength(1);
  });

  it("links the task of an attempt that stopped before its link write, and creates one only when Kaneo has none", async () => {
    const owner = await h.principal(h.a, h.owner);
    /** The state an attempt leaves when it stops between Kaneo's commit and the link write. */
    const stopped = async (projectId: string, postId: string) =>
      h.system(h.a, (db) =>
        db.insert(hookDeliveries).values({
          jobId: `task-rule:${postId}:${projectId}`,
          hookType: "task_rule",
          outcome: "processing",
        }),
      );

    const projectId = await project(h.a);
    const postId = await request(projectId);
    await h
      .db()
      .insert(kaneo.taskTable)
      .values({
        id: `${projectId}_orphan`,
        projectId,
        title: "Dark mode",
        number: 1,
        description: `Please add a dark theme.\n\n---\n\n**Feedback request:** [Dark mode](${portalPaths.teammatePost(h.a, postId)})`,
      });
    await stopped(projectId, postId);
    await move(postId, open, planned, owner);
    expect(await tasksIn(projectId)).toHaveLength(1);
    expect(await links(postId)).toEqual([
      { taskId: `${projectId}_orphan`, source: "rule" },
    ]);

    // The attempt stopped before Kaneo committed: the retry creates the task.
    const emptyProject = await project(h.a);
    const second = await request(emptyProject);
    await stopped(emptyProject, second);
    await move(second, open, planned, owner);
    const [created, ...more] = await tasksIn(emptyProject);
    expect(more).toEqual([]);
    expect(await links(second)).toEqual([
      { taskId: created!.id, source: "rule" },
    ]);
  });

  it("deletes the new task when the request is gone at the link write", async () => {
    const projectId = await project(h.a);
    const postId = await request(projectId);
    const owner = await h.principal(h.a, h.owner);
    goneBeforeLink = true;
    try {
      await move(postId, open, planned, owner);
    } finally {
      goneBeforeLink = false;
    }
    expect(await tasksIn(projectId)).toEqual([]);
    expect(await links(postId)).toEqual([]);
  });

  it("makes no task for a teammate without Kaneo task:create, and tells them why", async () => {
    const projectId = await project(h.a);
    const postId = await request(projectId);
    const actor = await h.principal(h.a, triage);

    await move(postId, open, planned, actor);
    expect(await tasksIn(projectId)).toEqual([]);
    expect(await links(postId)).toEqual([]);
    expect(await activity(postId)).toEqual([
      { type: "task.create_failed", metadata: { reason: "forbidden" } },
    ]);
    const notices = await h.system(h.a, (db) =>
      db
        .select({
          type: inAppNotifications.type,
          title: inAppNotifications.title,
          body: inAppNotifications.body,
        })
        .from(inAppNotifications)
        .where(eq(inAppNotifications.principalId, actor)),
    );
    expect(notices).toEqual([
      {
        type: "task_create_failed",
        title: 'No task was created for "Dark mode"',
        body: "You cannot create tasks in this project",
      },
    ]);
  });

  it("creates no task when the change's API key does not allow task:create", async () => {
    const projectId = await project(h.a);
    const denied = await request(projectId);
    const actor = await h.principal(h.a, h.mate);
    await move(denied, open, planned, actor, { keyTasks: "update" });
    expect(await tasksIn(projectId)).toEqual([]);
    expect(await activity(denied)).toEqual([
      { type: "task.create_failed", metadata: { reason: "forbidden" } },
    ]);
    // The same teammate with a key that allows it gets the task.
    const allowed = await request(projectId);
    await move(allowed, open, planned, actor, { keyTasks: "create,update" });
    expect(await links(allowed)).toEqual([
      { taskId: expect.any(String), source: "rule" },
    ]);
  });

  it("refuses a project of another workspace and an archived project", async () => {
    const owner = await h.principal(h.a, h.owner);
    const foreign = await project(h.b);
    const archived = await project(h.a, true);
    const intoForeign = await request(foreign);
    const intoArchived = await request(archived);

    await move(intoForeign, open, planned, owner);
    await move(intoArchived, open, planned, owner);
    expect(await tasksIn(foreign)).toEqual([]);
    expect(await tasksIn(archived)).toEqual([]);
    expect(await activity(intoForeign)).toEqual([
      { type: "task.create_failed", metadata: { reason: "forbidden" } },
    ]);
    expect(await activity(intoArchived)).toEqual([
      { type: "task.create_failed", metadata: { reason: "archived" } },
    ]);
  });

  it("does nothing for a change without a teammate or one made by task sync", async () => {
    const projectId = await project(h.a);
    const postId = await request(projectId);
    const owner = await h.principal(h.a, h.owner);

    await move(postId, open, planned, undefined);
    await move(postId, planned, open, owner, { source: "task" });
    await move(postId, open, planned, owner, { source: "task" });
    expect(await tasksIn(projectId)).toEqual([]);
    const jobs = await h.system(h.a, (db) =>
      db
        .select({ id: jobQueue.id })
        .from(jobQueue)
        .where(
          and(
            like(jobQueue.dedupeKey, "task-rule:%"),
            sql`${jobQueue.payload}->>'postId' = ${postId}`,
          ),
        ),
    );
    expect(jobs).toEqual([]);
    expect(await activity(postId)).toEqual([]);
  });

  it("comments on the linked task when the request moves back, and leaves the task", async () => {
    const projectId = await project(h.a);
    const postId = await request(projectId);
    const owner = await h.principal(h.a, h.owner);
    await move(postId, open, planned, owner);
    const [task] = await tasksIn(projectId);

    await move(postId, planned, open, owner);
    const comments = await h
      .db()
      .select({
        userId: kaneo.activityTable.userId,
        content: kaneo.activityTable.content,
      })
      .from(kaneo.activityTable)
      .where(
        and(
          eq(kaneo.activityTable.taskId, task!.id),
          eq(kaneo.activityTable.type, "comment"),
        ),
      );
    expect(comments).toHaveLength(1);
    expect(comments[0]!.userId).toBe(h.owner);
    expect(comments[0]!.content).toContain("moved back to **Open**");
    expect(comments[0]!.content).toContain(`/feedback/${h.a}/posts/${postId}`);
    expect(await tasksIn(projectId)).toHaveLength(1);
    expect(await links(postId)).toEqual([{ taskId: task!.id, source: "rule" }]);

    // A forward move adds no comment.
    await move(postId, open, planned, owner);
    const after = await h
      .db()
      .select({ id: kaneo.activityTable.id })
      .from(kaneo.activityTable)
      .where(
        and(
          eq(kaneo.activityTable.taskId, task!.id),
          eq(kaneo.activityTable.type, "comment"),
        ),
      );
    expect(after).toHaveLength(1);
  });
});
