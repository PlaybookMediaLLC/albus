import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { TypeId } from "@kaneo/ids";
import { postActivity } from "../../database/quills/schema/activity";
import { boards } from "../../database/quills/schema/boards";
import { events } from "../../database/quills/schema/events";
import { postTasks } from "../../database/quills/schema/platform-links";
import { posts } from "../../database/quills/schema/posts";
import { postStatuses } from "../../database/quills/schema/statuses";
import * as kaneo from "../../database/schema";
import { startFeature } from "./harness.fixture";

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
// Fails the link write on demand, after Kaneo created the task.
let failLink = false;
vi.mock("../integrations/post-task", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../integrations/post-task")>();
  return {
    ...actual,
    linkCreatedTask: async (
      ...args: Parameters<typeof actual.linkCreatedTask>
    ) => {
      if (failLink) throw new Error("Injected link failure");
      return actual.linkCreatedTask(...args);
    },
  };
});

const url = process.env.QUILLS_TEST_DATABASE_URL;
let world: Awaited<ReturnType<typeof startFeature>>;
let postId: TypeId<"post">;
let archived: string;

const columns = (projectId: string) =>
  world.db.insert(kaneo.columnTable).values([
    { projectId, name: "To do", slug: "to-do", position: 0 },
    { projectId, name: "Done", slug: "done", position: 1, isFinal: true },
  ]);
const tasksIn = (projectId: string) =>
  world.db
    .select({
      id: kaneo.taskTable.id,
      title: kaneo.taskTable.title,
      description: kaneo.taskTable.description,
      status: kaneo.taskTable.status,
      priority: kaneo.taskTable.priority,
    })
    .from(kaneo.taskTable)
    .where(eq(kaneo.taskTable.projectId, projectId));
const create = (user: string, body: Record<string, unknown>) =>
  world.request(user, "POST", `/posts/${postId}/tasks`, body);
const list = (user: string) =>
  world.request(user, "GET", `/posts/${postId}/tasks`);

describe.skipIf(!url)("Requests become Kaneo tasks", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    world = await startFeature(pool, url!, "posttasks");
    await columns(world.projects.open);
    // The harness seeds task 1 in this project without Kaneo's counter.
    await world.db
      .update(kaneo.projectTable)
      .set({ lastTaskNumber: 1 })
      .where(eq(kaneo.projectTable.id, world.projects.open));
    await columns(world.projects.hidden);
    archived = `${world.a}_archived`;
    await world.db.insert(kaneo.projectTable).values({
      id: archived,
      workspaceId: world.a,
      name: "Archived",
      slug: "ARC",
      archivedAt: new Date(),
    });
    await columns(archived);
    postId = await world.scoped(
      world.a,
      world.users.owner,
      async (db, actor) => {
        const [board] = await db
          .insert(boards)
          .values({ name: "Ideas", slug: `ideas-${Date.now()}` })
          .returning({ id: boards.id });
        const [post] = await db
          .insert(posts)
          .values({
            title: "Dark mode",
            content: "Please add a dark theme.",
            boardId: board!.id,
            principalId: actor.principalId,
          })
          .returning({ id: posts.id });
        return post!.id;
      },
    );
  }, 120000);
  afterAll(() => world?.stop());

  it("creates the task as the caller with the template, links it and lists it", async () => {
    const res = await create(world.users.owner, {
      projectId: world.projects.open,
    });
    expect(res.status).toBe(200);
    const task = (await tasksIn(world.projects.open)).find(
      (one) => one.id === res.body.taskId,
    );
    expect(res.body).toEqual({
      taskId: task!.id,
      projectId: world.projects.open,
    });
    expect(task).toMatchObject({
      title: "Dark mode",
      status: "to-do",
      priority: "medium",
    });
    expect(task!.description).toContain("Please add a dark theme.");
    expect(task!.description).toContain(`/feedback/${world.a}/posts/${postId}`);
    const link = await world.scoped(world.a, world.users.owner, (db) =>
      db
        .select({ source: postTasks.source })
        .from(postTasks)
        .where(eq(postTasks.taskId, task!.id)),
    );
    expect(link).toEqual([{ source: "manual" }]);
    const notes = await world.scoped(world.a, world.users.owner, (db) =>
      db
        .select({ type: postActivity.type, metadata: postActivity.metadata })
        .from(postActivity)
        .where(eq(postActivity.postId, postId)),
    );
    expect(notes).toEqual([
      { type: "task.created", metadata: { source: "manual" } },
    ]);
    const listed = await list(world.users.owner);
    expect(listed.status).toBe(200);
    expect(listed.body.hidden).toBe(0);
    expect(listed.body.items).toEqual([
      expect.objectContaining({
        taskId: task!.id,
        title: "Dark mode",
        columnName: "To do",
        done: false,
        source: "manual",
        key: `${world.projects.open}-2`,
      }),
    ]);
  });

  it("refuses a teammate without Kaneo task:create and an archived project", async () => {
    const before = await tasksIn(world.projects.open);
    const denied = await create(world.users.member, {
      projectId: world.projects.open,
    });
    expect(denied.status).toBe(403);
    expect(await tasksIn(world.projects.open)).toEqual(before);
    const closed = await create(world.users.owner, { projectId: archived });
    expect(closed.status).toBe(409);
    expect(closed.body.message).toBe("The project is archived");
    expect(await tasksIn(archived)).toEqual([]);
  });

  it("counts a task in a project the teammate cannot open, without its fields", async () => {
    const res = await create(world.users.owner, {
      projectId: world.projects.hidden,
      title: "Secret plan",
    });
    expect(res.status).toBe(200);
    const listed = await list(world.users.member);
    expect(listed.status).toBe(200);
    expect(listed.body.hidden).toBe(1);
    expect(JSON.stringify(listed.body)).not.toContain("Secret plan");
    expect(JSON.stringify(listed.body)).not.toContain(world.projects.hidden);
  });

  it("deletes the new Kaneo task when the link write fails", async () => {
    const before = await tasksIn(world.projects.open);
    failLink = true;
    try {
      const res = await create(world.users.owner, {
        projectId: world.projects.open,
      });
      expect(res.status).toBe(500);
    } finally {
      failLink = false;
    }
    expect(await tasksIn(world.projects.open)).toEqual(before);
  });

  it("records the task actions that a scoped API key allows on a status change", async () => {
    const owner = world.users.owner;
    await world.db.insert(kaneo.apikeyTable).values({
      id: `${owner}_key`,
      key: `${owner}_key`,
      name: "Scoped",
      referenceId: owner,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const statuses = await world.scoped(world.a, owner, (db) =>
      db.select({ id: postStatuses.id }).from(postStatuses).limit(2),
    );
    const keyTasks = async () => {
      const rows = await world.scoped(world.a, owner, (db) =>
        db
          .select({ payload: events.payload })
          .from(events)
          .where(
            and(
              eq(events.type, "post.status_changed"),
              eq(events.entityId, postId),
            ),
          )
          .orderBy(desc(events.id))
          .limit(1),
      );
      return (rows[0]!.payload as Record<string, string>).keyTasks;
    };
    // The rule may comment with this key (update) but not create a task.
    const scoped = await world.request(
      owner,
      "PUT",
      `/posts/${postId}/status`,
      { statusId: statuses[0]!.id },
      {
        "x-test-scope": JSON.stringify({
          workspace: ["read"],
          quills: ["read", "update"],
          task: ["update"],
        }),
      },
    );
    expect(scoped.status).toBe(200);
    expect(await keyTasks()).toBe("update");
    // A session (no key) leaves the rule the teammate's own permissions.
    expect(
      (
        await world.request(owner, "PUT", `/posts/${postId}/status`, {
          statusId: statuses[1]!.id,
        })
      ).status,
    ).toBe(200);
    expect(await keyTasks()).toBeUndefined();
  });
});
