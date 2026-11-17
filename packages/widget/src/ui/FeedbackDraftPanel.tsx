import { useState } from "react";
import { Icon } from "./Icon.js";
import type { FeedbackDraft } from "./types.js";

/** The suggested title and board for the visitor's words, with similar requests to vote on instead. */
export function FeedbackDraftPanel({
  draft,
  canSend,
  onPost,
  onDismiss,
  onOpenPost,
  onVote,
}: {
  draft: FeedbackDraft;
  canSend: boolean;
  onPost: () => void;
  onDismiss: () => void;
  onOpenPost?: (id: string) => void;
  onVote?: (postId: string) => Promise<unknown>;
}) {
  const [voted, setVoted] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        draft.similar.filter((item) => item.voted).map((item) => item.id),
      ),
  );
  const [voting, setVoting] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="qb-draft" aria-label="Suggested title">
      <h2>Suggested title</h2>
      <p className="qb-draft-title" dir="auto">
        {draft.title}
      </p>
      {draft.board?.name && (
        <p className="qb-draft-board">Board: {draft.board.name}</p>
      )}
      <p className="qb-form-note">
        Your feedback stays as you wrote it. Nothing is posted until you choose
        Post.
      </p>
      {!!draft.similar.length && (
        <div className="qb-draft-similar">
          <h3>Similar requests</h3>
          <ul>
            {draft.similar.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="qb-draft-link"
                  dir="auto"
                  onClick={() => onOpenPost?.(item.id)}
                >
                  {item.title}
                </button>
                {onVote && (
                  <button
                    type="button"
                    className="qb-vote-button"
                    aria-pressed={voted.has(item.id)}
                    disabled={voted.has(item.id) || voting === item.id}
                    aria-label={`${voted.has(item.id) ? "Voted" : "Vote"}: ${item.title}`}
                    onClick={async () => {
                      setVoting(item.id);
                      setError("");
                      try {
                        await onVote(item.id);
                        setVoted((set) => new Set(set).add(item.id));
                      } catch {
                        setError("Your vote was not saved. Try again.");
                      } finally {
                        setVoting("");
                      }
                    }}
                  >
                    <Icon name={voted.has(item.id) ? "check" : "up"} />
                    {voted.has(item.id) ? "Voted" : "Vote"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p className="qb-form-error" role="alert">
          {error}
        </p>
      )}
      <div className="qb-draft-actions">
        <button
          type="button"
          className="qb-primary"
          disabled={!canSend}
          onClick={onPost}
        >
          Post with this title
        </button>
        <button type="button" className="qb-text-button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </section>
  );
}
