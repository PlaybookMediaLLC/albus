import { Link } from "@tanstack/react-router";
import { RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { relativeTime } from "../../../core/relative-time";
import { useRequestConversationSummary } from "../../../hooks/team/use-request-conversation-summary";
import { useTeamRuntime } from "../../../team/runtime";
import { teamHref } from "../../../team/team-href";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { Button } from "../../../ui/upstream";

export interface SummarySectionProps {
  workspaceId: string;
  conversationId: string;
  summary: string | null;
  summaryUpdatedAt: string | null;
}

/**
 * The AI summary of the thread. A worker writes it after a request and its change event refreshes
 * the conversation; without AI the request is refused (409).
 */
export function SummarySection(props: SummarySectionProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const request = useRequestConversationSummary(team.viewer);
  // The summary time when the request went out: a newer summary ends the wait.
  const [sentAt, setSentAt] = useState<string | null>();
  const off = request.error?.kind === "conflict";
  const waiting = request.isSuccess && sentAt === props.summaryUpdatedAt;
  const allowed = team.permissions.update && !off;
  const label = t(
    props.summary
      ? "team-conversations.summary.refresh"
      : "team-conversations.summary.create",
  );
  const summarize = () => {
    setSentAt(props.summaryUpdatedAt);
    request.mutate({
      param: {
        workspaceId: props.workspaceId,
        conversationId: props.conversationId,
      },
    });
  };
  return (
    <PanelSection
      title={t("team-conversations.summary.title")}
      action={
        props.summary && allowed ? (
          <IconButton
            label={label}
            disabled={request.isPending || waiting}
            onClick={summarize}
          >
            <RefreshCw
              aria-hidden="true"
              className={
                request.isPending || waiting
                  ? "motion-safe:animate-spin"
                  : undefined
              }
            />
          </IconButton>
        ) : null
      }
    >
      <div className="grid gap-2">
        {props.summary ? (
          <div>
            <p className="whitespace-pre-wrap text-sm">{props.summary}</p>
            {props.summaryUpdatedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("team-conversations.summary.updated", {
                  time: relativeTime(props.summaryUpdatedAt, i18n.language),
                })}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("team-conversations.summary.empty")}
          </p>
        )}
        <p role="status" className="text-sm text-muted-foreground">
          {waiting
            ? t("team-conversations.summary.requested")
            : off
              ? t("team-conversations.summary.off")
              : null}
        </p>
        {request.isError && !off ? (
          <p role="alert" className="text-sm text-destructive">
            {t("team-conversations.problem.failed")}
          </p>
        ) : null}
        {off && team.permissions.manageSettings ? (
          <Link
            to={teamHref(props.workspaceId, "/settings/conversations/ai")}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("team-conversations.summary.settings")}
          </Link>
        ) : null}
        {!props.summary && allowed ? (
          <div>
            <Button
              variant="outline"
              size="sm"
              loading={request.isPending}
              disabled={waiting}
              onClick={summarize}
            >
              <Sparkles aria-hidden="true" />
              {label}
            </Button>
          </div>
        ) : null}
      </div>
    </PanelSection>
  );
}
