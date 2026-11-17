import { useRef } from "react";
import { Icon } from "./Icon.js";
import { SearchField } from "./SearchField.js";
import { feedbackStatusLabels } from "./feedback.js";
import { RoadmapView } from "./RoadmapView.js";
import type {
  FeedbackPost,
  FeedbackFilters,
  WidgetViewProps,
} from "./types.js";
import { useT } from "./i18n/useT.js";

export function FeedbackView({
  posts,
  onOpen,
  onCompose,
  filters,
  onFilters,
  onVote,
  offline,
}: {
  posts: readonly FeedbackPost[];
  onOpen: (id: string) => void;
  onCompose: () => void;
  filters: FeedbackFilters;
  onFilters: (filters: FeedbackFilters) => void;
  onVote?: WidgetViewProps["onVoteFeedback"];
  offline?: boolean;
}) {
  const t = useT();
  const { query, sort, status } = filters;
  const search = useRef<HTMLInputElement>(null);
  const term = query.trim().toLowerCase();
  const filtered = posts.filter(
    (post) =>
      (status === "all" || (post.status ?? "open") === status) &&
      `${post.title} ${post.body}`.toLowerCase().includes(term),
  );
  if (sort === "votes")
    filtered.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  else if (sort === "title")
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  return (
    <div className="qb-list-view">
      <div className="qb-title-row">
        <h1>{sort === "roadmap" ? t("Roadmap") : t("Feedback")}</h1>
        <label
          className="qb-sort"
          data-active={sort !== "default"}
          title={
            sort === "votes"
              ? t("Sorted by most votes")
              : sort === "title"
                ? t("Sorted by title")
                : t("Sort feedback")
          }
        >
          <Icon name="filter" />
          <select
            aria-label={t("Sort feedback")}
            value={sort}
            onChange={(event) =>
              onFilters({ ...filters, sort: event.target.value })
            }
          >
            <option value="default">{t("Default order")}</option>
            <option value="votes">{t("Most votes")}</option>
            <option value="title">{t("Title")}</option>
            <option value="roadmap">{t("Roadmap")}</option>
          </select>
        </label>
      </div>
      {sort === "roadmap" ? (
        <RoadmapView
          posts={posts}
          onOpen={onOpen}
          expanded={filters.roadmapExpanded ?? []}
          onVote={onVote}
          offline={offline}
          onExpanded={(roadmapExpanded) =>
            onFilters({ ...filters, roadmapExpanded })
          }
        />
      ) : (
        <>
          <SearchField
            label={t("Search feedback")}
            value={query}
            onChange={(query) => onFilters({ ...filters, query })}
            inputRef={search}
          />
          <div
            className="qb-status-filters"
            role="group"
            aria-label={t("Feedback status")}
          >
            {(
              ["all", "open", "planned", "in_progress", "shipped"] as const
            ).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={status === value}
                onClick={() => onFilters({ ...filters, status: value })}
              >
                {value === "all" ? t("All") : t(feedbackStatusLabels[value])}
              </button>
            ))}
          </div>
          <div className="qb-feedback-list">
            {filtered.map((post) => (
              <button
                type="button"
                key={post.id}
                className="qb-feedback-row"
                onClick={() => onOpen(post.id)}
              >
                <span className="qb-avatar">{post.author.slice(0, 1)}</span>
                <span className="qb-feedback-copy">
                  <strong>{post.title}</strong>
                  <span>{post.body}</span>
                  <small>
                    {post.author}
                    {post.status && (
                      <> · {t(feedbackStatusLabels[post.status])}</>
                    )}
                    {post.following && ` · ${t("Following")}`}
                  </small>
                </span>
                {post.votes !== undefined && (
                  <span
                    className="qb-votes"
                    aria-label={t("{count} votes", { count: post.votes })}
                  >
                    <Icon name="up" />
                    {post.votes}
                  </span>
                )}
              </button>
            ))}
          </div>
          {!filtered.length && (
            <div className="qb-empty" role={term ? "status" : undefined}>
              <span className="qb-empty-icon">
                <Icon name={term ? "search" : "feedback"} />
              </span>
              <h2>
                {term
                  ? t("No feedback matches your search.")
                  : t("Be the first to share an idea.")}
              </h2>
              <p>
                {term
                  ? t("Try another word or clear your search.")
                  : t("Have something in mind? Submit your feedback below.")}
              </p>
            </div>
          )}
        </>
      )}
      {sort !== "roadmap" && (
        <div className="qb-floating-action">
          <button type="button" className="qb-primary" onClick={onCompose}>
            <Icon name="plus" />
            {t("Submit feedback")}
          </button>
        </div>
      )}
    </div>
  );
}
