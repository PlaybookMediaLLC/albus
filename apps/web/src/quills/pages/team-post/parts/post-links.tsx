import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetLinkedConversationsForPost } from "../../../hooks/team/use-get-linked-conversations-for-post";
import { useListPostTasks } from "../../../hooks/team/use-list-post-tasks";
import { useUnlinkPostFromTask } from "../../../hooks/team/use-unlink-post-from-task";
import { useTeamRuntime } from "../../../team/runtime";
import { teamHref } from "../../../team/team-href";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { PropertyRow } from "../../../ui/inbox/property-row";
import { CreateTaskDialog } from "../../../team/post-tasks/create-task-dialog";
import { LinkTaskDialog } from "../../../team/post-tasks/link-task-dialog";
import { Button } from "../../../ui/upstream";
import { LinkedTask } from "./linked-task";

export interface PostLinksProps {
  workspaceId: string;
  post: { id: string; title: string; boardId: string };
}

/** The Kaneo tasks and the support conversations that a request links to, and the task actions. */
export function PostLinks({ workspaceId, post }: PostLinksProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [dialog, setDialog] = useState<"create" | "link" | null>(null);
  const tasks = useListPostTasks(
    { param: { workspaceId, postId: post.id } },
    team.viewer,
  );
  const conversations = useGetLinkedConversationsForPost(
    { param: { workspaceId, postId: post.id } },
    team.viewer,
  );
  const unlink = useUnlinkPostFromTask(team.viewer);
  const items = tasks.data?.items ?? [];
  const hidden = tasks.data?.hidden ?? 0;
  const failed = tasks.error ?? conversations.error ?? unlink.error;
  const update = team.permissions.update;
  return (
    <PanelSection title={t("team-post.links")}>
      {failed ? (
        <p role="alert" className="text-sm text-destructive-foreground">
          {t("core.problem.failed")}
        </p>
      ) : null}
      <PropertyRow label={t("team-post.tasks")}>
        <div className="grid gap-1.5">
          {items.length || hidden ? (
            <ul className="grid grid-cols-1 gap-1.5">
              {items.map((task) => (
                <li key={task.taskId}>
                  <LinkedTask
                    workspaceId={workspaceId}
                    task={task}
                    unlinking={unlink.isPending}
                    onUnlink={
                      update
                        ? () =>
                            unlink.mutate({
                              param: {
                                workspaceId,
                                postId: post.id,
                                taskId: task.taskId,
                              },
                            })
                        : undefined
                    }
                  />
                </li>
              ))}
              {hidden ? (
                <li className="text-muted-foreground">
                  {t("team-post.hiddenTasks", { count: hidden })}
                </li>
              ) : null}
            </ul>
          ) : (
            <span className="text-muted-foreground">
              {tasks.isLoading
                ? t("team-post.loadingTask")
                : t("team-post.none")}
            </span>
          )}
          {update ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setDialog("create")}
              >
                {t("team-post.createTask")}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setDialog("link")}
              >
                {t("team-post.linkTask")}
              </Button>
            </div>
          ) : null}
        </div>
      </PropertyRow>
      <PropertyRow label={t("team-post.conversations")}>
        {conversations.data?.items.length ? (
          <ul className="grid grid-cols-1 gap-1">
            {conversations.data.items.map((item) => (
              <li key={item.conversationId}>
                <Link
                  to={teamHref(
                    workspaceId,
                    `/conversations/${encodeURIComponent(item.conversationId)}`,
                  )}
                  className="flex min-w-0 items-center gap-1.5 hover:underline"
                >
                  <MessagesSquare
                    aria-hidden="true"
                    className="size-4 shrink-0"
                  />
                  <span className="truncate">
                    {item.subject ?? t("team-post.noSubject")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground">{t("team-post.none")}</span>
        )}
      </PropertyRow>
      {dialog === "create" ? (
        <CreateTaskDialog
          workspaceId={workspaceId}
          post={post}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "link" ? (
        <LinkTaskDialog
          workspaceId={workspaceId}
          postId={post.id}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </PanelSection>
  );
}
