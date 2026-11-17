import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../core/types";
import { ArrowUpIcon } from "../arrow-up-icon";
import { ConfirmAction } from "../confirm-action";
import { StateView } from "../state-view";
import { cn } from "../upstream";

// A changed count and a new vote settle into place; nothing moves on the first render.
const settle =
  "transition duration-150 ease-out motion-reduce:transition-none starting:translate-y-0.5 starting:opacity-0";

export interface PostVoteButtonProps {
  voted: boolean;
  /** Left out when the board hides vote counts; the button still votes. */
  voteCount?: number;
  disabled?: boolean;
  loading?: boolean;
  problem?: PortalProblem | null;
  onRetry?: () => void;
  onVote: (voted: boolean) => Promise<void>;
}

export function PostVoteButton(props: PostVoteButtonProps) {
  const { t } = useTranslation("quills");
  const [first] = useState([props.voted, props.voteCount]);
  const [moved, setMoved] = useState(false);
  if (!moved && (props.voted !== first[0] || props.voteCount !== first[1]))
    setMoved(true);
  return (
    <div className="portal-vote relative z-10 shrink-0 text-xs">
      <StateView problem={props.problem ?? null} onRetry={props.onRetry}>
        <ConfirmAction
          labelKey={props.voted ? "post.removeVote" : "post.vote"}
          pressed={props.voted}
          disabled={props.disabled || props.loading}
          variant="pill"
          size="default"
          className="min-w-13"
          onConfirm={() => props.onVote(!props.voted)}
        >
          <ArrowUpIcon
            key={String(props.voted)}
            className={cn("size-3", moved && settle)}
          />
          {props.voteCount === undefined ? null : (
            <span
              key={props.voteCount}
              aria-hidden="true"
              className={moved ? settle : undefined}
            >
              {props.voteCount}
            </span>
          )}
        </ConfirmAction>
      </StateView>
      {props.voteCount === undefined ? null : (
        <span className="sr-only" aria-live="polite">
          {t("post.votes", { count: props.voteCount })}
        </span>
      )}
    </div>
  );
}
