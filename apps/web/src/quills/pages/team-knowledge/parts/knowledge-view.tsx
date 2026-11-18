import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { teamHref } from "../../../team/team-href";
import { TeamStateView } from "../../../team/team-state-view";
import { DetailHeader } from "../../../ui/inbox/detail-header";
import { DetailLayout } from "../../../ui/inbox/detail-layout";
import { ListPane } from "../../../ui/inbox/list-pane";
import { useListNavigation } from "../../../ui/inbox/use-list-navigation";
import {
  KnowledgeActions,
  type KnowledgeActionsProps,
} from "./knowledge-actions";
import { KnowledgeDetail, type KnowledgeDetailProps } from "./knowledge-detail";
import { KnowledgeRow, type KnowledgeSuggestion } from "./knowledge-row";

export interface KnowledgeViewProps {
  workspaceId: string;
  /** The open suggestion as the list shows it; the detail comes when its query answers. */
  suggestion: KnowledgeSuggestion;
  detail: KnowledgeDetailProps["suggestion"] | undefined;
  /** The suggestions of the list in display order, for the compact list. */
  suggestions: readonly KnowledgeSuggestion[];
  /** The result of the last change. */
  message: string;
  /** The problem of the detail query or the last change. */
  problem: PortalProblem | null;
  onMove: (id: string) => void;
  onBack: () => void;
  steps: Omit<KnowledgeDetailProps, "suggestion">;
  actions: Omit<KnowledgeActionsProps, "suggestion">;
}

/** The open suggestion in two panes: the compact list, and the suggestion with its steps. */
export function KnowledgeView({
  suggestion,
  suggestions,
  ...props
}: KnowledgeViewProps) {
  const { t } = useTranslation("quills");
  const nav = useListNavigation({
    ids: suggestions.map((item) => item.id),
    activeId: suggestion.id,
    onMove: props.onMove,
    onBack: props.onBack,
  });
  return (
    <DetailLayout
      list={
        <ListPane title={t("knowledge.title")} headingLevel={2}>
          <ul className="grid grid-cols-1 gap-0.5">
            {suggestions.map((item) => (
              <li key={item.id}>
                <KnowledgeRow
                  suggestion={item}
                  href={teamHref(props.workspaceId, "/knowledge")}
                  compact
                  selected={item.id === suggestion.id}
                  onOpen={() => props.onMove(item.id)}
                />
              </li>
            ))}
          </ul>
        </ListPane>
      }
      listLabel={t("knowledge.title")}
    >
      <DetailHeader
        onBack={props.onBack}
        onPrevious={nav.previous}
        onNext={nav.next}
      >
        <div className="min-w-0">
          <h1
            tabIndex={-1}
            className="line-clamp-2 text-lg font-semibold leading-tight outline-none"
          >
            {suggestion.title ?? suggestion.candidateTitle}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {t("knowledge.evidence", { count: suggestion.evidenceCount })}
          </p>
        </div>
      </DetailHeader>
      {props.detail ? (
        <KnowledgeDetail suggestion={props.detail} {...props.steps} />
      ) : null}
      <p
        role="status"
        className="px-6 text-sm text-muted-foreground [&:not(:empty)]:pb-2"
      >
        {props.message}
      </p>
      <div className="px-6">
        <TeamStateView
          loading={!props.detail && !props.problem}
          problem={props.problem}
        >
          {null}
        </TeamStateView>
      </div>
      <div className="grow" />
      {/* The detail is fresher than the list row. */}
      <KnowledgeActions
        suggestion={props.detail ?? suggestion}
        {...props.actions}
      />
    </DetailLayout>
  );
}
