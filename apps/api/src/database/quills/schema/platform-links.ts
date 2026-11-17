import { sql } from "drizzle-orm";
import {
  check,
  text,
  timestamp,
  primaryKey,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { typeIdColumn } from "@kaneo/ids/drizzle";
import { quillsSchema, workspaceColumn, workspacePolicy } from "../tenancy";
import { projectTable, taskTable } from "../../schema";
import { boards } from "./boards";
import { posts } from "./posts";

export const boardProjects = quillsSchema
  .table(
    "board_projects",
    {
      workspaceId: workspaceColumn(),
      boardId: typeIdColumn("board")("board_id").notNull(),
      projectId: text("project_id").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      primaryKey({ columns: [t.workspaceId, t.boardId, t.projectId] }),
      foreignKey({
        columns: [t.workspaceId, t.boardId],
        foreignColumns: [boards.workspaceId, boards.id],
      }).onDelete("cascade"),
      foreignKey({
        columns: [t.workspaceId, t.projectId],
        foreignColumns: [projectTable.workspaceId, projectTable.id],
      }).onDelete("cascade"),
      index("board_projects_project_idx").on(t.projectId),
      workspacePolicy(t.workspaceId),
    ],
  )
  .enableRLS();

export const POST_TASK_SOURCES = ["manual", "rule", "import"] as const;

export const postTasks = quillsSchema
  .table(
    "post_tasks",
    {
      workspaceId: workspaceColumn(),
      postId: typeIdColumn("post")("post_id").notNull(),
      taskId: text("task_id")
        .notNull()
        .references(() => taskTable.id, { onDelete: "cascade" }),
      /** How the link came: a teammate (manual), a board rule (rule) or an import (RFC 0005). */
      source: text("source", { enum: POST_TASK_SOURCES })
        .notNull()
        .default("manual"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      primaryKey({ columns: [t.workspaceId, t.postId, t.taskId] }),
      foreignKey({
        columns: [t.workspaceId, t.postId],
        foreignColumns: [posts.workspaceId, posts.id],
      }).onDelete("cascade"),
      index("post_tasks_task_idx").on(t.taskId),
      check(
        "post_tasks_source_check",
        sql`${t.source} IN ('manual', 'rule', 'import')`,
      ),
      workspacePolicy(t.workspaceId),
    ],
  )
  .enableRLS();
