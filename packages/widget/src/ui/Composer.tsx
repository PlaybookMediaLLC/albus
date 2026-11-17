import { useId, useRef, useState } from "react";
import { Icon } from "./Icon.js";
import { Avatar } from "./Avatar.js";
import { AttachmentControls } from "./AttachmentControls.js";
import { FeedbackDraftPanel } from "./FeedbackDraftPanel.js";
import { FeedbackFields } from "./FeedbackFields.js";
import { missingFields, toFieldValues, type RawFieldValue } from "./fields.js";
import { suggestArticles } from "./search.js";
import { useAction } from "./useAction.js";
import { useSimilarRequests } from "./useSimilarRequests.js";
import type {
  FeedbackDraft,
  FeedbackField,
  FeedbackPost,
  SubmissionOptions,
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
  onDraft,
  fields = [],
}: {
  kind: "message" | "feedback" | "reply" | "comment";
  draft: Draft;
  onChange: (body: string) => void;
  /** Feedback: the custom field values, and the title and board that the visitor took from a draft. */
  onSubmit?: (
    extra?: Pick<SubmissionOptions, "title" | "boardId" | "customFields">,
  ) => void;
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
  /** Feedback: suggests a title and a board from the visitor's words. */
  onDraft?: (body: string) => Promise<FeedbackDraft>;
  /** Feedback: the public custom fields of the board that the post goes to. */
  fields?: readonly FeedbackField[];
}) {
  const t = useT();
  const form = useRef<HTMLFormElement>(null);
  const fieldId = useId();
  const [preparing, setPreparing] = useState(false);
  const [suggested, setSuggested] = useState<{
    body: string;
    draft: FeedbackDraft;
  } | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [values, setValues] = useState<Record<string, RawFieldValue>>({});
  const { body, pending, error, files } = draft;
  // A suggestion belongs to the text it was made for: an edit hides it.
  const shown =
    kind === "feedback" && suggested?.body === body.trim()
      ? suggested.draft
      : null;
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
  const suggestions = shown
    ? []
    : kind === "feedback"
      ? similar
      : kind === "message" && body.trim().length >= 3
        ? suggestArticles(articles, body)
        : [];
  // A suggested board asks for its own fields.
  const asked = kind === "feedback" ? (shown?.board?.fields ?? fields) : [];
  const missing = missingFields(asked, values);
  const canSend =
    !!onSubmit &&
    (!!body.trim() || !!files.length) &&
    !pending &&
    !preparing &&
    !offline &&
    !missing.length;
  const extra = () => {
    const customFields = toFieldValues(asked, values);
    return Object.keys(customFields).length ? { customFields } : {};
  };
  return (
    <form
      ref={form}
      className={`qb-composer qb-compose-${kind}${kind === "reply" ? " qb-reply-composer" : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSubmit?.(extra());
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
              if (canSend) onSubmit?.(extra());
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
      {kind === "feedback" && (
        <FeedbackFields
          fields={asked}
          values={values}
          disabled={pending}
          onChange={(key, value) =>
            setValues((all) => ({ ...all, [key]: value }))
          }
        />
      )}
      {kind === "feedback" &&
        !!missing.length &&
        (body.trim() || !!files.length) && (
          <p className="qb-form-note">
            Fill in {missing.map((field) => field.label).join(", ")} to post.
          </p>
        )}
      {kind === "feedback" && onDraft && !shown && body.trim().length >= 3 && (
        <button
          type="button"
          className="qb-text-button qb-draft-button"
          disabled={drafting || pending || offline}
          onClick={async () => {
            const text = body.trim();
            setDrafting(true);
            setDraftError("");
            try {
              setSuggested({ body: text, draft: await onDraft(text) });
            } catch {
              setDraftError(
                "A title could not be suggested right now. You can still post your feedback as written.",
              );
            } finally {
              setDrafting(false);
            }
          }}
        >
          {drafting ? "Suggesting a title…" : "Suggest a title"}
        </button>
      )}
      {kind === "feedback" && draftError && !shown && (
        <p className="qb-form-note" role="alert">
          {draftError}
        </p>
      )}
      {shown && (
        <FeedbackDraftPanel
          draft={shown}
          canSend={canSend}
          onPost={() =>
            onSubmit?.({
              ...extra(),
              title: shown.title,
              boardId: shown.board?.id,
            })
          }
          onDismiss={() => setSuggested(null)}
          onOpenPost={onOpenPost}
          onVote={onVote && ((postId) => onVote(postId, true))}
        />
      )}
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
