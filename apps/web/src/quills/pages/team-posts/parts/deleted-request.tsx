import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shortDate } from "../../../core/short-date";
import { useRestorePost } from "../../../hooks/team/use-restore-post";
import { useTeamRuntime } from "../../../team/runtime";
import { PostStatusIcon } from "../../../ui/inbox/post-status-icon";
import { Button, toast } from "../../../ui/upstream";
import {
  postRow,
  statusIcon,
  type ListedPost,
  type RowContext,
} from "../post-list";

export interface DeletedRequestProps {
  post: ListedPost;
  context: RowContext;
}

/**
 * A row of the deleted requests: the title, the board and the delete date, and Restore for a
 * teammate with the delete permission. A deleted request does not open, so the row is not a link.
 */
export function DeletedRequest({ post, context }: DeletedRequestProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const restore = useRestorePost(team.viewer);
  const row = postRow(post, context);
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm">
      <PostStatusIcon {...statusIcon(post, context.statuses)} />
      <span className="min-w-0 flex-1 truncate font-medium">{row.title}</span>
      {row.board ? (
        <span className="hidden max-w-32 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground sm:inline">
          {row.board}
        </span>
      ) : null}
      {post.deletedAt ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {t("team-posts.deletedOn", {
            date: shortDate(post.deletedAt, i18n.language),
          })}
        </span>
      ) : null}
      {restore.error ? (
        <span role="alert" className="text-xs text-destructive-foreground">
          {t(
            restore.error.kind === "conflict"
              ? "core.problem.conflict"
              : "core.problem.failed",
          )}
        </span>
      ) : null}
      {team.permissions.delete ? (
        <Button
          size="xs"
          variant="outline"
          aria-label={t("team-posts.restoreTitle", { title: row.title })}
          loading={restore.isPending}
          // The restored row leaves the list before the mutation ends, so the toast
          // waits for the promise: a mutate callback would not run after the unmount.
          onClick={() =>
            restore
              .mutateAsync({
                param: { workspaceId: team.workspaceId, postId: post.id },
              })
              .then(
                () =>
                  toast.success(t("team-posts.restored", { title: row.title })),
                () => undefined,
              )
          }
        >
          <RotateCcw aria-hidden="true" />
          {t("team-posts.restore")}
        </Button>
      ) : null}
    </div>
  );
}
