import { useTranslation } from "react-i18next";
import type { ListKnowledgeSuggestionsResponse } from "../../../api/team/list-knowledge-suggestions";
import { RequestRow } from "../../../ui/inbox/request-row";

export type KnowledgeSuggestion =
  ListKnowledgeSuggestionsResponse["items"][number];

/** The label of each suggestion status. */
export const knowledgeStatusKeys = {
  awaiting_answer: "knowledge.status.awaiting_answer",
  drafting: "knowledge.status.drafting",
  draft_ready: "knowledge.status.draft_ready",
  approved: "knowledge.status.approved",
  dismissed: "knowledge.status.dismissed",
} as const;

export interface KnowledgeRowProps {
  suggestion: KnowledgeSuggestion;
  href: string;
  onOpen: () => void;
  selected?: boolean;
  compact?: boolean;
}

/** One suggestion in the list: its title, the customer question, and its step and evidence. */
export function KnowledgeRow({ suggestion, ...row }: KnowledgeRowProps) {
  const { t } = useTranslation("quills");
  return (
    <RequestRow
      {...row}
      title={suggestion.title ?? suggestion.candidateTitle}
      detail={suggestion.topic}
      badges={[
        ...(suggestion.gap ? [{ id: "gap", label: t("knowledge.gap") }] : []),
        { id: "status", label: t(knowledgeStatusKeys[suggestion.status]) },
        {
          id: "evidence",
          label: t("knowledge.evidence", { count: suggestion.evidenceCount }),
        },
      ]}
      time={suggestion.updatedAt}
    />
  );
}
