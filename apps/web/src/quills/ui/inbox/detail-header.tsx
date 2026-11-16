import { ChevronDown, ChevronLeft, ChevronUp, PanelRight } from "lucide-react";
import { type ReactNode, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Button, cn } from "../upstream";
import { DetailPaneContext } from "./detail-pane-context";
import { IconButton } from "./icon-button";

export interface DetailHeaderProps {
  /** The left side, such as the customer's avatar and name. */
  children?: ReactNode;
  /** The right side: the assignee pill, the status button, menus. */
  actions?: ReactNode;
  /** Shows the back button first. Esc does the same through useListNavigation. */
  onBack?: () => void;
  /** The visible text of the back button, such as the board name. */
  backLabel?: string;
  /** The previous and next arrows (K and J), when both are given. */
  onPrevious?: () => void;
  onNext?: () => void;
}

/** The top row of an open item. Inside a DetailLayout it also toggles the right panel. */
export function DetailHeader({
  children,
  actions,
  onBack,
  backLabel,
  onPrevious,
  onNext,
}: DetailHeaderProps) {
  const { t } = useTranslation("quills");
  const panel = useContext(DetailPaneContext)?.panel;
  const steps = [
    { key: "K", label: t("inbox.previous"), icon: ChevronUp, run: onPrevious },
    { key: "J", label: t("inbox.next"), icon: ChevronDown, run: onNext },
  ];
  return (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2 max-sm:px-2">
      {onBack ? (
        <Button
          variant="ghost"
          size={backLabel ? "sm" : "icon-sm"}
          aria-label={
            backLabel ? t("inbox.backTo", { name: backLabel }) : t("inbox.back")
          }
          aria-keyshortcuts="Escape"
          className="min-w-0 shrink"
          onClick={onBack}
        >
          <ChevronLeft aria-hidden="true" />
          {backLabel ? (
            <span className="min-w-0 truncate">{backLabel}</span>
          ) : null}
        </Button>
      ) : null}
      {/* A title keeps at least 12rem: when it would get less, the actions wrap to a second row. */}
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          children && "basis-48",
        )}
      >
        {children}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 max-sm:gap-0.5">
        {actions}
        {onPrevious && onNext
          ? steps.map(({ key, label, icon: Icon, run }) => (
              <IconButton
                key={key}
                label={label}
                aria-keyshortcuts={key}
                onClick={run}
              >
                <Icon aria-hidden="true" />
              </IconButton>
            ))
          : null}
        {panel ? (
          <IconButton
            label={panel.label}
            aria-expanded={panel.open}
            onClick={panel.toggle}
          >
            <PanelRight aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}
