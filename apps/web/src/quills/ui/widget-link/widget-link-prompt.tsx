import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmAction } from "../confirm-action";
import { Card, CardContent, CardHeader, CardTitle } from "../upstream";

export interface WidgetLinkPromptProps {
  /** The name of the workspace whose support widget asked. */
  workspaceName: string;
  /** Set once the person answered: the prompt then only reports the result. */
  answer: "linked" | "declined" | null;
  onConfirm: () => Promise<void>;
  onDecline: () => Promise<void>;
}

/**
 * Asks a signed-in person before their activity from the support widget joins their portal
 * account (issue #129). Someone else may have pressed "Open in portal" with their address, so
 * nothing is linked until they confirm.
 */
export function WidgetLinkPrompt({
  workspaceName,
  answer,
  onConfirm,
  onDecline,
}: WidgetLinkPromptProps) {
  const { t } = useTranslation("quills");
  const titleId = useId();
  if (answer)
    return (
      <p className="rounded-lg bg-muted px-4 py-3" role="status">
        {answer === "linked"
          ? t("widget-link.linked")
          : t("widget-link.declined")}
      </p>
    );
  return (
    <Card aria-labelledby={titleId} role="region">
      <CardHeader>
        <CardTitle id={titleId}>{t("widget-link.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">
          {t("widget-link.body", { workspace: workspaceName })}
        </p>
        <div className="flex flex-wrap gap-2">
          <ConfirmAction labelKey="widget-link.confirm" onConfirm={onConfirm} />
          <ConfirmAction
            labelKey="widget-link.decline"
            onConfirm={onDecline}
            variant="outline"
          />
        </div>
      </CardContent>
    </Card>
  );
}
