import type { ReactNode } from "react";
import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";
import { relativeTime } from "./relative-time.js";
import { useAction } from "./useAction.js";
import type { FeedbackComment } from "./types.js";
import { useLocale, useT } from "./i18n/useT.js";

export function CommentThread({
  comment,
  comments,
  ancestors,
  onReply,
  renderReply,
  onVote,
  offline,
}: {
  comment: FeedbackComment;
  comments: readonly FeedbackComment[];
  ancestors: readonly string[];
  onReply: (id: string) => void;
  renderReply: (id: string) => ReactNode;
  onVote?: (id: string, voted: boolean) => Promise<unknown>;
  offline: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const action = useAction();
  const age = relativeTime(comment.createdAt, locale, t("Just now"));
  const path = [...ancestors, comment.id];
  return (
    <div className="qb-comment-thread">
      <article
        className="qb-comment"
        aria-label={t("Comment by {author}", { author: comment.author })}
      >
        <Avatar
          name={comment.author}
          avatarUrl={comment.avatarUrl}
          verified={comment.verified}
        />
        <div className="qb-comment-content">
          <div className="qb-comment-meta">
            <strong>{comment.author}</strong>
            {age && <time dateTime={comment.createdAt}>{age}</time>}
          </div>
          <p>{comment.body}</p>
          <div className="qb-comment-actions">
            <button type="button" onClick={() => onReply(comment.id)}>
              {t("Reply")}
            </button>
            <button
              type="button"
              className="qb-votes"
              aria-label={t("Vote for comment by {author}", {
                author: comment.author,
              })}
              aria-pressed={!!comment.voted}
              disabled={offline || !onVote || action.pending}
              onClick={() => {
                if (onVote)
                  void action.run(() => onVote(comment.id, !comment.voted));
              }}
            >
              <Icon name="up" />
              {comment.votes}
            </button>
          </div>
          {action.error && (
            <p role="alert" className="qb-form-error">
              {action.error}
            </p>
          )}
          {renderReply(comment.id)}
        </div>
      </article>
      <div className="qb-comment-replies" data-indent={ancestors.length < 2}>
        {comments
          .filter(
            (child) =>
              child.parentId === comment.id && !path.includes(child.id),
          )
          .map((child) => (
            <CommentThread
              key={child.id}
              comment={child}
              comments={comments}
              ancestors={path}
              onReply={onReply}
              renderReply={renderReply}
              onVote={onVote}
              offline={offline}
            />
          ))}
      </div>
    </div>
  );
}
