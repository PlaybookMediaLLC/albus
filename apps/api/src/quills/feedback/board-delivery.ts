import { and, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { boards } from "../../database/quills/schema/boards";
import { defineQuillsRoute } from "../framework/define-route";
import { taskTarget } from "../framework/platform-reads";
import {
  deliveryInput,
  deliveryOf,
  deliveryView,
  taskFailureMessages,
} from "../integrations/post-task";
import { checkTaskSyncStatus } from "../integrations/task-sync";
import { findBoard, loadProjects } from "./visibility";

// A board's delivery project and task rule (RFC 0005, phase 2, decisions 1, 4 and 5). It lives in
// boards.settings.delivery, not in board_projects: a project link hides the board from teammates who
// cannot open the project, and the delivery choice must never change who sees the board.

const params = z.object({ boardId: flexibleToTypeIdSchema("board") });
const errors = {
  403: "No task:create permission in the project",
  404: "Board, project or status not found",
  409: "The project is archived, the column does not exist, or the plan does not include tasks",
} as const;
const settingsEvent = (input: { params: { boardId: string } }) => ({
  type: "board.settings_updated" as const,
  entityType: "board" as const,
  entityId: input.params.boardId,
  payload: { fields: "delivery" },
});

const setDelivery = defineQuillsRoute({
  method: "put",
  path: "/boards/{boardId}/delivery",
  operationId: "setQuillsBoardDelivery",
  summary: "Set a board's delivery project and task rule",
  description:
    "The caller needs Quills manage_settings and task:create in the project, which must be a live project of this workspace. It does not change who sees the board. With a trigger status, a teammate who moves a request of the board to that status gets a task created as them.",
  action: "manage_settings",
  native: { task: ["create"] },
  params,
  body: deliveryInput,
  response: deliveryView.unwrap(),
  responseDescription: "The delivery settings",
  errors,
  event: settingsEvent,
  project: ({ body }) => body.projectId,
  load: async (input) => {
    const target = await taskTarget(
      input.workspaceId,
      input.userId,
      input.body.projectId,
      input.body.columnId,
    );
    if ("reason" in target)
      throw new HTTPException(target.reason === "forbidden" ? 403 : 409, {
        message: taskFailureMessages[target.reason],
      });
    return loadProjects(input);
  },
  handler: async ({ db, params, body, loaded: projects }) => {
    const board = await findBoard(db, params.boardId, projects);
    await checkTaskSyncStatus(db, body.triggerStatusId);
    const delivery = {
      projectId: body.projectId,
      columnId: body.columnId,
      priority: body.priority,
      triggerStatusId: body.triggerStatusId,
    };
    // jsonb || merges in one statement, so a parallel write of another key is kept.
    const [row] = await db
      .update(boards)
      .set({
        settings: sql`${boards.settings} || ${JSON.stringify({ delivery })}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(boards.id, board.id))
      .returning({ settings: boards.settings });
    return deliveryOf(row!.settings)!;
  },
});

const clearDelivery = defineQuillsRoute({
  method: "delete",
  path: "/boards/{boardId}/delivery",
  operationId: "clearQuillsBoardDelivery",
  summary: "Remove a board's delivery project and task rule",
  action: "manage_settings",
  params,
  response: z.object({ changed: z.boolean() }),
  responseDescription: "Removed",
  errors: { 404: "Board not found" },
  event: (input, result) => result.changed && settingsEvent(input),
  load: loadProjects,
  handler: async ({ db, params, loaded: projects }) => {
    const board = await findBoard(db, params.boardId, projects);
    const [row] = await db
      .update(boards)
      .set({
        settings: sql`${boards.settings} - 'delivery'`,
        updatedAt: new Date(),
      })
      .where(and(eq(boards.id, board.id), sql`${boards.settings} ? 'delivery'`))
      .returning({ id: boards.id });
    return { changed: Boolean(row) };
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>()
  .openapi(...setDelivery)
  .openapi(...clearDelivery);
