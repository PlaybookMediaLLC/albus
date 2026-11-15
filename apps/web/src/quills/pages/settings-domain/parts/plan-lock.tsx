import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/upstream";

/** The lock takes no props: it always gives the same reason. */
export type PlanLockProps = Record<string, never>;

/** The lock beside a control that needs an active plan (settings spec 1.6). */
export function PlanLock() {
  const { t } = useTranslation("quills");
  const reason = t("settings-workspace.domain.needsPlan");
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="img"
            aria-label={reason}
            className="text-warning-foreground"
          />
        }
      >
        <Lock aria-hidden="true" className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
