import { useId, useRef, useState } from "react";
import { Icon } from "./Icon.js";
import { Avatar } from "./Avatar.js";
import { AttachmentControls } from "./AttachmentControls.js";
import { FeedbackDraftPanel } from "./FeedbackDraftPanel.js";
import { FeedbackFields } from "./FeedbackFields.js";
import { missingFields, toFieldValues, type RawFieldValue } from "./fields.js";
import { suggestArticles, suggestFeedback } from "./search.js";
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

export function Composer({
  kind,
  draft,
  onChange,
  onSubmit,
  articles = [],
  posts = [],
  onOpenArticle,
  onOpenPost,
  onBrowseHelp,
  offline = false,
  teamMember,
  attachmentsEnabled = false,
  attachmentReset,
  onFilesChange,
  onCapture,
  articleContext,
  onDraft,
  onVote,
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
  /** Feedback: votes for a similar request instead of posting. */
  onVote?: (postId: string) => Promise<unknown>;
  /** Feedback: the public custom fields of the board that the post goes to. */
  fields?: readonly FeedbackField[];
}) {
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
      ? "Your feedback"
      : kind === "reply"
        ? "Your reply"
        : kind === "comment"
          ? "Your comment"
          : "Your message";
  const suggestions =
    body.trim().length >= 3 && !shown
      ? kind === "feedback"
        ? suggestFeedback(posts, body)
        : kind === "message"
          ? suggestArticles(articles, body)
          : []
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
          <h1>What can we help you with?</h1>
          <p id={`${fieldId}-hint`}>Ask a question or share what you need.</p>
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
          Continue the conversation with the team.
        </p>
      )}
      {articleContext && (
        <p className="qb-article-context">About: {articleContext}</p>
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
              ? "What's on your mind?"
              : kind === "comment"
                ? "Add a comment…"
                : kind === "message"
                  ? "Message…"
                  : "Write a message…"
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
                ? "Posting your feedback…"
                : "Sending your message…"
              : ""}
          </span>
          <button
            className={kind === "feedback" ? "qb-primary" : "qb-send-round"}
            disabled={!canSend}
            type="submit"
            aria-label={
              pending
                ? "Sending…"
                : kind === "feedback"
                  ? "Post"
                  : kind === "reply"
                    ? "Send reply"
                    : kind === "comment"
                      ? "Post comment"
                      : "Send"
            }
          >
            {kind === "feedback" ? (
              pending ? (
                "Sending…"
              ) : (
                "Post"
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
          onVote={onVote}
        />
      )}
      {!!suggestions.length && (
        <aside
          className="qb-suggestions"
          aria-label={
            kind === "feedback" ? "Similar requests" : "Suggested help"
          }
        >
          <h2>
            {kind === "feedback" ? "Similar requests" : "Suggested articles"}
          </h2>
          {suggestions.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() =>
                kind === "feedback"
                  ? onOpenPost?.(item.id)
                  : onOpenArticle?.(item.id)
              }
            >
              <Icon name={kind === "feedback" ? "feedback" : "help"} />
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
          Browse help without losing your draft <Icon name="arrow" />
        </button>
      )}
      {(!onSubmit || offline) && (
        <p className="qb-form-note">
          {offline
            ? "You’re offline. Your draft stays here until you reconnect."
            : "Sending is not available right now."}
        </p>
      )}
      {error && (
        <p className="qb-form-error" role="alert" id={`${fieldId}-error`}>
          {error}
        </p>
      )}
    </form>
  );
}
