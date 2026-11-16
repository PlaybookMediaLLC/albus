import { PanelLeftOpen } from "lucide-react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { DetailPaneContext } from "./detail-pane-context";
import { IconButton } from "./icon-button";

export interface ShowListButtonProps {
  className?: string;
}

/** Shows the hidden list pane again. Renders nothing while the list is visible. */
export function ShowListButton({ className }: ShowListButtonProps) {
  const { t } = useTranslation("quills");
  const showList = useContext(DetailPaneContext)?.showList;
  if (!showList) return null;
  return (
    <IconButton
      className={className}
      label={t("inbox.showList")}
      onClick={showList}
    >
      <PanelLeftOpen aria-hidden="true" />
    </IconButton>
  );
}
