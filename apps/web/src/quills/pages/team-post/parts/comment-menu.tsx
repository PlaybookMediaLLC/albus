import { Ellipsis, MapPin, MapPinOff, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import type { ListPostCommentsResponse } from "../../../api/team/list-post-comments";
import { useDeleteComment } from "../../../hooks/team/use-delete-comment";
import { useRemoveCommentPin } from "../../../hooks/team/use-remove-comment-pin";
import { useRestoreComment } from "../../../hooks/team/use-restore-comment";
import { useSetCommentPin } from "../../../hooks/team/use-set-comment-pin";
import { useTeamRuntime } from "../../../team/runtime";
import { IconButton } from "../../../ui/inbox/icon-button";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
  toast,
} from "../../../ui/upstream";

type Comment = ListPostCommentsResponse["items"][number];

export interface CommentMenuProps {
  workspaceId: string;
  post: GetPostResponse;
  comment: Comment;
  onEdit: () => void;
}

/**
 * The menu of a comment in the team view: edit, pin or unpin, and delete with undo.
 * The API decides; the menu leaves out what the permissions or the comment do not allow.
 */
export function CommentMenu({
  workspaceId,
  post,
  comment,
  onEdit,
}: CommentMenuProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const pin = useSetCommentPin(team.viewer);
  const unpin = useRemoveCommentPin(team.viewer);
  const remove = useDeleteComment(team.viewer);
  const restore = useRestoreComment(team.viewer);
  const { update } = team.permissions;
  const pinned = post.pinnedCommentId === comment.id;
  // Only a public, root-level teammate comment can be the official answer.
  const pinnable =
    comment.isTeamMember && !comment.isPrivate && !comment.parentId;
  const own = comment.principalId === post.viewerPrincipalId;
  const deletable = team.permissions.delete || (update && own);
  if (!update && !deletable) return null;
  const failedToast = () => toast.error(t("core.problem.failed"));
  const failed = { onError: failedToast };
  const pinInput = {
    param: { workspaceId, postId: post.id, commentId: comment.id },
  };
  const commentInput = { param: { workspaceId, commentId: comment.id } };
  // A restore needs the delete permission, and it does not pin the comment again.
  const undoable = team.permissions.delete && !pinned;
  // The deleted comment loses this menu before the mutation settles, so the toast follows the
  // promise: per-call mutate callbacks do not run after the menu unmounts.
  const deleteComment = () =>
    remove.mutateAsync(commentInput).then(
      () =>
        toast.success(
          t("team-post.commentDeleted"),
          undoable
            ? {
                action: {
                  label: t("team-post.undo"),
                  onClick: () =>
                    void restore.mutateAsync(commentInput).catch(failedToast),
                },
              }
            : undefined,
        ),
      failedToast,
    );
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            size="icon-xs"
            className="text-muted-foreground"
            label={t("team-post.commentMenu")}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="end">
        {update ? (
          <MenuItem onClick={onEdit}>
            <Pencil aria-hidden="true" />
            {t("team-post.editComment")}
          </MenuItem>
        ) : null}
        {update && pinned ? (
          <MenuItem onClick={() => unpin.mutate(pinInput, failed)}>
            <MapPinOff aria-hidden="true" />
            {t("team-post.unpin")}
          </MenuItem>
        ) : update && pinnable ? (
          <MenuItem onClick={() => pin.mutate(pinInput, failed)}>
            <MapPin aria-hidden="true" />
            {t("team-post.pin")}
          </MenuItem>
        ) : null}
        {deletable ? (
          <>
            {update ? <MenuSeparator /> : null}
            <MenuItem
              variant="destructive"
              onClick={() => void deleteComment()}
            >
              <Trash2 aria-hidden="true" />
              {t("team-post.deleteComment")}
            </MenuItem>
          </>
        ) : null}
      </MenuPopup>
    </Menu>
  );
}
