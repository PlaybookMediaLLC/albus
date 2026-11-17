import { asc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { postTasks } from "../../database/quills/schema/platform-links";
import { defineQuillsRoute } from "../framework/define-route";
import {
  assignable,
  linkedTasks,
  taskTarget,
} from "../framework/platform-reads";
import { createKaneoTask, deleteKaneoTask } from "../framework/platform-writes";
import {
  linkCreatedTask,
  taskDraft,
  taskFailureMessages,
} from "../integrations/post-task";
import { findPost, loadProjects } from "./visibility";

// Requests become Kaneo tasks (RFC 0005, phase 1): create a task from a request as the caller, and list a
// request's tasks. Linking an existing task stays in quills/links.ts.

const params = z.object({ postId: flexibleToTypeIdSchema("post") });

const createTask = defineQuillsRoute({
  method: "post",
  path: "/posts/{postId}/tasks",
  operationId: "createQuillsPostTask",
  summary: "Create a Kaneo task from a post and link it",
  description:
    "Creates the task as the caller through Kaneo's task controller, then links it to the post. The caller needs Quills update, Kaneo task:create and access to the project. The task gets the post title, a description with the post text, a link back and the demand counts (no customer names), the post's target date, the post owner as assignee when Kaneo allows it, and the board's delivery priority (default medium).",
  action: "update",
  native: { task: ["create"] },
  params,
  body: z.object({
    projectId: z.string().min(1).max(200),
    columnId: z.string().min(1).max(200).nullable().optional().openapi({
      description:
        "The column of the task. Omitted or null: the project's first column that is not final.",
    }),
    title: z.string().trim().min(1).max(500).optional().openapi({
      description: "Omitted: the post title.",
    }),
  }),
  response: z.object({ taskId: z.string(), projectId: z.string() }),
  responseDescription: "The created and linked task",
  errors: {
    400: "Kaneo refused the task fields",
    404: "Post or project not found",
    409: "The project is archived, the column does not exist, or the plan does not include it",
  },
  project: ({ body }) => body.projectId,
  load: loadProjects,
  event: ({ params }, result) => ({
    type: "post.task_linked",
    entityType: "post",
    entityId: params.postId,
    payload: { taskId: result.taskId, source: "manual" },
  }),
  prepare: async ({ db, params, loaded: projects, actor }) => {
    const draft = await taskDraft(db, params.postId, projects);
    if (!draft) throw new HTTPException(404, { message: "Post not found" });
    return { draft, userId: actor.userId };
  },
  call: async ({ draft, userId }, { body, workspaceId }) => {
    const target = await taskTarget(
      workspaceId,
      userId,
      body.projectId,
      body.columnId ?? null,
    );
    if ("reason" in target)
      throw new HTTPException(target.reason === "forbidden" ? 403 : 409, {
        message: taskFailureMessages[target.reason],
      });
    const owner = draft.ownerUserId;
    const task = await createKaneoTask({
      userId,
      projectId: body.projectId,
      status: target.status,
      title: body.title ?? draft.title,
      description: draft.description,
      priority: draft.delivery?.priority ?? "medium",
      assigneeId:
        owner && (await assignable(workspaceId, body.projectId, owner))
          ? owner
          : undefined,
      dueDate: draft.dueDate,
    });
    return { ...task, userId };
  },
  // The post was deleted between the read and the link: the new task must not stay unlinked.
  revert: (task) => deleteKaneoTask(task.id, task.userId),
  handler: async ({ db, actor, params, called }) => {
    if (!(await linkCreatedTask(db, actor, params.postId, called.id, "manual")))
      throw new HTTPException(404, { message: "Post not found" });
    return { taskId: called.id, projectId: called.projectId };
  },
});

const task = z.object({
  taskId: z.string(),
  key: z
    .string()
    .nullable()
    .openapi({ description: "Kaneo's ticket ID, such as APP-12." }),
  title: z.string(),
  projectId: z.string(),
  columnName: z.string().nullable(),
  columnColor: z.string().nullable(),
  done: z.boolean().openapi({ description: "The task is in a final column." }),
  assigneeName: z.string().nullable(),
  source: z.enum(["manual", "rule", "import"]),
});

const listTasks = defineQuillsRoute({
  method: "get",
  path: "/posts/{postId}/tasks",
  operationId: "listQuillsPostTasks",
  summary: "List the Kaneo tasks linked to a post",
  description:
    "The linked tasks in projects that the caller can open, oldest link first, at most 100. `hidden` counts the linked tasks in projects that the caller cannot open; their fields are left out.",
  action: "read",
  native: { project: ["read"] },
  params,
  response: z.object({ items: z.array(task), hidden: z.number() }),
  responseDescription: "Linked tasks",
  errors: { 404: "Post not found" },
  load: loadProjects,
  prepare: async ({ db, params, loaded: projects, actor }) => {
    await findPost(db, params.postId, projects);
    const links = await db
      .select({ taskId: postTasks.taskId, source: postTasks.source })
      .from(postTasks)
      .where(eq(postTasks.postId, params.postId))
      .orderBy(asc(postTasks.createdAt), asc(postTasks.taskId))
      .limit(100);
    return { links, userId: actor.userId };
  },
  // Kaneo reads, with no Quills transaction open: only tasks in projects the caller can open.
  call: async ({ links, userId }, { workspaceId }) => {
    const source = new Map(links.map((link) => [link.taskId, link.source]));
    const tasks = await linkedTasks(workspaceId, userId, [...source.keys()]);
    return {
      items: tasks.items.map((item) => ({
        ...item,
        source: source.get(item.taskId)!,
      })),
      hidden: tasks.hidden,
    };
  },
  handler: async ({ called }) => called,
});

export default apiRouter<BaseVariables & { workspaceId: string }>()
  .openapi(...createTask)
  .openapi(...listTasks);
