import { Link } from "@tanstack/react-router";
import { SquareCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ListPostTasksResponse } from "../../../api/team/list-post-tasks";
import { IconButton } from "../../../ui/inbox/icon-button";

export interface LinkedTaskProps {
  workspaceId: string;
  task: ListPostTasksResponse["items"][number];
  /** Removes the link. Left out without the update permission. */
  onUnlink?: () => void;
  unlinking?: boolean;
}

/** A Kaneo task that a request links to: its key, title, column and assignee, linked to Kaneo. */
export function LinkedTask({
  workspaceId,
  task,
  onUnlink,
  unlinking,
}: LinkedTaskProps) {
  const { t } = useTranslation("quills");
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <SquareCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="grid min-w-0 flex-1">
        <Link
          to={`/dashboard/workspace/${encodeURIComponent(workspaceId)}/project/${encodeURIComponent(task.projectId)}/task/${encodeURIComponent(task.taskId)}`}
          className="truncate hover:underline"
        >
          {task.key ? (
            <>
              <span className="font-mono text-xs text-muted-foreground">
                {task.key}
              </span>{" "}
            </>
          ) : null}
          {task.title}
        </Link>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {task.columnName ? (
            <span className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-current"
              />
              {task.columnName}
            </span>
          ) : null}
          {task.assigneeName ? (
            <span className="truncate">
              {t("team-post.taskAssignee", { name: task.assigneeName })}
            </span>
          ) : null}
        </span>
      </div>
      {onUnlink ? (
        <IconButton
          label={t("team-post.unlinkTask", { title: task.title })}
          onClick={onUnlink}
          disabled={unlinking}
        >
          <X aria-hidden="true" />
        </IconButton>
      ) : null}
    </div>
  );
}
