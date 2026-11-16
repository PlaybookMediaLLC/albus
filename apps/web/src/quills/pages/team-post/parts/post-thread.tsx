import { MapPin } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import type { ListPostCommentsResponse } from "../../../api/team/list-post-comments";
import { useTeamRuntime } from "../../../team/runtime";
import { MarkdownContent } from "../../../ui/markdown-content";
import { commentText, PostComment } from "../../../ui/post/post-comment";
import { Button } from "../../../ui/upstream";
import { CommentBox } from "./comment-box";
import { CommentMenu } from "./comment-menu";
import { CommentVote } from "./comment-vote";
import { EditComment } from "./edit-comment";

type Comment = ListPostCommentsResponse["items"][number];

export interface PostThreadProps {
  workspaceId: string;
  post: GetPostResponse;
  comments: readonly Comment[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

/**
 * The comments of a request: customer comments, team replies and private notes, with replies.
 * The pinned comment, the official answer, comes first.
 */
export function PostThread(props: PostThreadProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [editing, setEditing] = useState<string | null>(null);
  const known = new Set(props.comments.map((comment) => comment.id));
  // A reply whose parent is not loaded shows at the top level.
  const childrenOf = (parentId: string | null) =>
    props.comments.filter((comment) =>
      parentId
        ? comment.parentId === parentId
        : !comment.parentId || !known.has(comment.parentId),
    );
  const pinnedId = props.post.pinnedCommentId;
  const roots = childrenOf(null).sort(
    (a, b) => Number(b.id === pinnedId) - Number(a.id === pinnedId),
  );
  const render = (comment: Comment) => {
    const replies = childrenOf(comment.id);
    const deleted = Boolean(comment.deletedAt) || comment.isRemovedByTeam;
    const text = (
      <MarkdownContent content={comment.content} className={commentText} />
    );
    return (
      <PostComment
        key={comment.id}
        comment={{
          id: comment.id,
          parentId: comment.parentId,
          content: comment.content,
          author: {
            name: comment.authorName,
            avatarUrl: comment.authorAvatarUrl,
            isTeamMember: comment.isTeamMember,
          },
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          deleted,
          isAuthor: false,
          canEdit: false,
          canDelete: false,
          pending: comment.moderationState === "pending",
          reactions: comment.reactions,
        }}
        menu={
          deleted || editing === comment.id ? undefined : (
            <CommentMenu
              workspaceId={props.workspaceId}
              post={props.post}
              comment={comment}
              onEdit={() => setEditing(comment.id)}
            />
          )
        }
        reactions={
          <CommentVote
            workspaceId={props.workspaceId}
            commentId={comment.id}
            reactions={comment.reactions}
          />
        }
        replyForm={
          team.permissions.create
            ? (parentId, close) => (
                <CommentBox
                  workspaceId={props.workspaceId}
                  postId={props.post.id}
                  parentId={parentId}
                  label={t("team-post.replyTo", {
                    name: comment.authorName ?? t("team-post.anonymous"),
                  })}
                  onSent={close}
                />
              )
            : undefined
        }
        body={
          editing === comment.id ? (
            <EditComment
              workspaceId={props.workspaceId}
              commentId={comment.id}
              content={comment.content}
              onDone={() => setEditing(null)}
            />
          ) : comment.isPrivate ? (
            <div className="mt-1 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("team-post.note")}
              </p>
              {text}
            </div>
          ) : comment.id === pinnedId ? (
            <>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                <MapPin aria-hidden="true" className="size-3" />
                {t("team-post.pinned")}
              </p>
              {text}
            </>
          ) : undefined
        }
      >
        {replies.length ? replies.map(render) : undefined}
      </PostComment>
    );
  };
  return (
    <section aria-labelledby="team-post-thread" className="grid gap-4">
      <h2 id="team-post-thread" className="text-sm font-semibold">
        {t("team-post.thread", { count: props.post.commentCount })}
      </h2>
      {props.comments.length ? (
        <ol className="grid grid-cols-1 gap-5">{roots.map(render)}</ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("team-post.noReplies")}
        </p>
      )}
      {props.hasMore ? (
        <Button
          variant="ghost"
          loading={props.loadingMore}
          onClick={props.onLoadMore}
        >
          {t("team-post.loadMore")}
        </Button>
      ) : null}
    </section>
  );
}
