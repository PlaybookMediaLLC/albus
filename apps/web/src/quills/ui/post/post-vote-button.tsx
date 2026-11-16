import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../core/types";
import { ArrowUpIcon } from "../arrow-up-icon";
import { ConfirmAction } from "../confirm-action";
import { StateView } from "../state-view";

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
          <ArrowUpIcon className="size-3" />
          {props.voteCount === undefined ? null : (
            <span aria-hidden="true">{props.voteCount}</span>
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
