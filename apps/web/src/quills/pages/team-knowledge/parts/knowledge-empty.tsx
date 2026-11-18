import { useTranslation } from "react-i18next";
import { EmptyState } from "../../../ui/empty-state";
import { HelpArt } from "../../../ui/illustrations/help-art";

export type KnowledgeEmptyProps = Record<string, never>;

/** The empty suggestion list. */
export function KnowledgeEmpty() {
  const { t } = useTranslation("quills");
  return (
    <EmptyState
      art={<HelpArt />}
      title={t("empty.knowledge.title")}
      description={t("empty.knowledge.body")}
    />
  );
}
