import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FloatingActionBar } from "../../../ui/inbox/floating-action-bar";
import { knowledgeStatusKeys, type KnowledgeSuggestion } from "./knowledge-row";

export interface KnowledgeActionsProps {
  suggestion: Pick<KnowledgeSuggestion, "status">;
  /** True while a decision runs. */
  busy: boolean;
  onApprove: () => void;
  onDismiss: () => void;
}

const open = new Set(["awaiting_answer", "drafting", "draft_ready"]);

/** The decisions in the floating action bar: approve a ready draft, or dismiss an open suggestion. */
export function KnowledgeActions({
  suggestion,
  busy,
  ...props
}: KnowledgeActionsProps) {
  const { t } = useTranslation("quills");
  const shown = [
    {
      id: "approve",
      show: suggestion.status === "draft_ready",
      label: t("knowledge.approve"),
      shortcut: "a",
      icon: Check,
      onSelect: props.onApprove,
    },
    {
      id: "dismiss",
      show: open.has(suggestion.status),
      label: t("knowledge.dismiss"),
      shortcut: "d",
      icon: X,
      onSelect: props.onDismiss,
    },
  ]
    .filter((action) => action.show)
    .map((action) => ({ ...action, disabled: busy }));
  const [primary, ...actions] = shown;
  return primary ? (
    <FloatingActionBar
      label={t("knowledge.actions")}
      status={
        <span className="px-3 text-sm font-medium">
          {t(knowledgeStatusKeys[suggestion.status])}
        </span>
      }
      actions={actions}
      primary={primary}
    />
  ) : null;
}
