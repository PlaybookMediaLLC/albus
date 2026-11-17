import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";
import { feedbackStatusLabels } from "./feedback.js";
import { useAction } from "./useAction.js";
import type { FeedbackPost, FeedbackStatus, WidgetViewProps } from "./types.js";
import { useT } from "./i18n/useT.js";

/**
 * In progress, planned and shipped requests. Open ones take a vote from the list; a shipped request
 * that the visitor voted for is marked "For you".
 */
export function RoadmapView({
  posts,
  onOpen,
  expanded,
  onExpanded,
  onVote,
  offline,
}: {
  posts: readonly FeedbackPost[];
  onOpen: (id: string) => void;
  expanded: readonly FeedbackStatus[];
  onExpanded: (statuses: readonly FeedbackStatus[]) => void;
  onVote?: WidgetViewProps["onVoteFeedback"];
  offline?: boolean;
}) {
  const t = useT();
  const action = useAction();
  const groups = ["in_progress", "planned", "shipped"] as const;
  return (
    <div className="qb-roadmap">
      {groups.map((status) => {
        const items = posts.filter((post) => post.status === status);
        if (!items.length) return null;
        return (
          <section
            className="qb-roadmap-group"
            data-status={status}
            key={status}
          >
            <h2>
              {t(feedbackStatusLabels[status])}
              <span className="qb-status-dot" />
            </h2>
            {(expanded.includes(status) ? items : items.slice(0, 3)).map(
              (post) => (
                <div className="qb-roadmap-item" key={post.id}>
                  <button
                    type="button"
                    className="qb-roadmap-open"
                    onClick={() => onOpen(post.id)}
                  >
                    <span className="qb-feedback-copy">
                      <strong>{post.title}</strong>
                      <span>{post.body}</span>
                      <small>
                        <Avatar name={post.author} avatarUrl={post.avatarUrl} />
                        {post.author}
                        {status === "shipped" && post.voted && (
                          <span className="qb-for-you">{t("For you")}</span>
                        )}
                      </small>
                    </span>
                  </button>
                  {status !== "shipped" && onVote ? (
                    <button
                      type="button"
                      className="qb-votes"
                      aria-pressed={!!post.voted}
                      aria-label={`${post.voted ? t("Voted for {title}", { title: post.title }) : t("Vote for {title}", { title: post.title })}${post.votes === undefined ? "" : ` · ${post.votes}`}`}
                      disabled={offline || action.pending}
                      onClick={() =>
                        void action.run(() => onVote(post.id, !post.voted))
                      }
                    >
                      <Icon name="up" />
                      {post.votes}
                    </button>
                  ) : (
                    post.votes !== undefined && (
                      <span className="qb-votes">
                        <Icon name="up" />
                        {post.votes}
                      </span>
                    )
                  )}
                </div>
              ),
            )}
            {items.length > 3 && (
              <button
                type="button"
                className="qb-roadmap-more"
                aria-expanded={expanded.includes(status)}
                onClick={() =>
                  onExpanded(
                    expanded.includes(status)
                      ? expanded.filter((value) => value !== status)
                      : [...expanded, status],
                  )
                }
              >
                {expanded.includes(status) ? t("Show less") : t("Show more")}
                <Icon name="down" />
              </button>
            )}
          </section>
        );
      })}
      {!posts.some((post) => post.status && post.status !== "open") && (
        <p className="qb-empty">{t("No roadmap items yet.")}</p>
      )}
    </div>
  );
}
