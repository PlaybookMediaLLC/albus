import { useId, useRef, useState } from "react";
import { Icon } from "./Icon.js";
import { Avatar } from "./Avatar.js";
import { AttachmentControls } from "./AttachmentControls.js";
import { suggestArticles } from "./search.js";
import { useAction } from "./useAction.js";
import { useSimilarRequests } from "./useSimilarRequests.js";
import type {
  FeedbackPost,
  HelpArticle,
  WidgetPerson,
  WidgetViewProps,
} from "./types.js";
import type { Draft } from "./useDrafts.js";
import { useT } from "./i18n/useT.js";

export function Composer({
  kind,
  draft,
  onChange,
  onSubmit,
  articles = [],
  posts = [],
  onOpenArticle,
  onOpenPost,
  onFindSimilar,
  onVote,
  onBrowseHelp,
  offline = false,
  teamMember,
  attachmentsEnabled = false,
  attachmentReset,
  onFilesChange,
  onCapture,
  articleContext,
}: {
  kind: "message" | "feedback" | "reply" | "comment";
  draft: Draft;
  onChange: (body: string) => void;
  onSubmit?: () => void;
  articles?: readonly HelpArticle[];
  posts?: readonly FeedbackPost[];
  onOpenArticle?: (id: string) => void;
  onOpenPost?: (id: string) => void;
  onFindSimilar?: WidgetViewProps["onFindSimilar"];
  onVote?: WidgetViewProps["onVoteFeedback"];
  onBrowseHelp?: () => void;
  offline?: boolean;
  teamMember?: WidgetPerson;
  attachmentsEnabled?: boolean;
  attachmentReset?: number;
  onFilesChange?: (files: readonly File[]) => void;
  onCapture?: WidgetViewProps["onCaptureScreenshot"];
  articleContext?: string;
}) {
  const t = useT();
  const form = useRef<HTMLFormElement>(null);
  const fieldId = useId();
  const [preparing, setPreparing] = useState(false);
  const { body, pending, error, files } = draft;
  const compact = kind === "reply" || kind === "comment";
  const label =
    kind === "feedback"
      ? t("Your feedback")
      : kind === "reply"
        ? t("Your reply")
        : kind === "comment"
          ? t("Your comment")
          : t("Your message");
  const similar = useSimilarRequests(
    body,
    posts,
    onFindSimilar,
    kind === "feedback",
  );
  // Votes cast here, for requests the widget has not loaded.
  const [votedHere, setVotedHere] = useState<Record<string, boolean>>({});
  const voting = useAction();
  const suggestions =
    kind === "feedback"
      ? similar
      : kind === "message" && body.trim().length >= 3
        ? suggestArticles(articles, body)
        : [];
  const canSend =
    !!onSubmit &&
    (!!body.trim() || !!files.length) &&
    !pending &&
    !preparing &&
    !offline;
  return (
    <form
      ref={form}
      className={`qb-composer qb-compose-${kind}${kind === "reply" ? " qb-reply-composer" : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSubmit?.();
      }}
    >
      {kind === "message" && (
        <div className="qb-conversation-intro">
          <Avatar {...(teamMember ?? { name: "Quills" })} />
          <h1>{t("What can we help you with?")}</h1>
          <p id={`${fieldId}-hint`}>
            {t("Ask a question or share what you need.")}
          </p>
        </div>
      )}
      <label
        className={kind === "reply" ? "qb-composer-label" : "qb-sr-only"}
        htmlFor={fieldId}
      >
        {label}
      </label>
      {kind === "reply" && (
        <p className="qb-composer-hint" id={`${fieldId}-hint`}>
          {t("Continue the conversation with the team.")}
        </p>
      )}
      {articleContext && (
        <p className="qb-article-context">
          {t("About: {title}", { title: articleContext })}
        </p>
      )}
      <div className="qb-writing-area">
        <textarea
          id={fieldId}
          rows={kind === "message" ? 1 : 2}
          autoFocus={!compact}
          aria-describedby={
            `${kind === "message" || kind === "reply" ? `${fieldId}-hint` : ""}${error ? ` ${fieldId}-error` : ""}`.trim() ||
            undefined
          }
          placeholder={
            kind === "feedback"
              ? t("What's on your mind?")
              : kind === "comment"
                ? t("Add a comment…")
                : kind === "message"
                  ? t("Message…")
                  : t("Write a message…")
          }
          value={body}
          onChange={(event) => onChange(event.target.value)}
          readOnly={pending}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (canSend) onSubmit?.();
            }
          }}
        />
        {attachmentsEnabled && onFilesChange && (
          <AttachmentControls
            key={attachmentReset}
            files={files}
            onChange={onFilesChange}
            disabled={pending}
            camera={kind === "feedback"}
            onCapture={onCapture}
            onBusy={setPreparing}
            target={form}
          />
        )}
        <div className="qb-composer-actions">
          <span className="qb-send-status" aria-live="polite">
            {pending
              ? kind === "feedback"
                ? t("Posting your feedback…")
                : t("Sending your message…")
              : ""}
          </span>
          <button
            className={kind === "feedback" ? "qb-primary" : "qb-send-round"}
            disabled={!canSend}
            type="submit"
            aria-label={
              pending
                ? t("Sending…")
                : kind === "feedback"
                  ? t("Post")
                  : kind === "reply"
                    ? t("Send reply")
                    : kind === "comment"
                      ? t("Post comment")
                      : t("Send")
            }
          >
            {kind === "feedback" ? (
              pending ? (
                t("Sending…")
              ) : (
                t("Post")
              )
            ) : (
              <Icon name="up" />
            )}
          </button>
        </div>
      </div>
      {!!suggestions.length && (
        <aside
          className="qb-suggestions"
          aria-label={
            kind === "feedback" ? t("Similar requests") : t("Suggested help")
          }
        >
          <h2>
            {kind === "feedback"
              ? t("Similar requests")
              : t("Suggested articles")}
          </h2>
          {kind === "feedback"
            ? similar.map((item) => {
                const voted = votedHere[item.id] ?? !!item.voted;
                // A loaded post's count already moved; an unloaded one moves by this vote.
                const votes =
                  item.votes === undefined
                    ? undefined
                    : item.votes + Number(voted) - Number(!!item.voted);
                return (
                  <div className="qb-suggestion" key={item.id}>
                    <button type="button" onClick={() => onOpenPost?.(item.id)}>
                      <Icon name="feedback" />
                      {item.title}
                      <Icon name="chevron" />
                    </button>
                    {onVote && (
                      <button
                        type="button"
                        className="qb-votes"
                        aria-pressed={voted}
                        aria-label={
                          voted
                            ? t("Voted for {title}", { title: item.title })
                            : t("Vote for {title}", { title: item.title })
                        }
                        disabled={offline || voting.forKey(item.id).pending}
                        onClick={() =>
                          void voting.run(async () => {
                            await onVote(item.id, !voted);
                            setVotedHere((map) => ({
                              ...map,
                              [item.id]: !voted,
                            }));
                          }, item.id)
                        }
                      >
                        <Icon name="up" />
                        {votes}
                      </button>
                    )}
                  </div>
                );
              })
            : suggestions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onOpenArticle?.(item.id)}
                >
                  <Icon name="help" />
                  {item.title}
                  <Icon name="chevron" />
                </button>
              ))}
        </aside>
      )}
      {onBrowseHelp && kind === "message" && !!body.trim() && (
        <button
          type="button"
          className="qb-text-button qb-browse-help"
          onClick={onBrowseHelp}
        >
          {t("Browse help without losing your draft")} <Icon name="arrow" />
        </button>
      )}
      {(!onSubmit || offline) && (
        <p className="qb-form-note">
          {offline
            ? t("You’re offline. Your draft stays here until you reconnect.")
            : t("Sending is not available right now.")}
        </p>
      )}
      {error && (
        <p className="qb-form-error" role="alert" id={`${fieldId}-error`}>
          {t.text(error)}
        </p>
      )}
    </form>
  );
}
