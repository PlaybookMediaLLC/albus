import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../upstream";

export interface ComposerTitleProps extends ComponentProps<typeof Input> {
  workspaceName: string;
}

/** The composer's title field; its placeholder names the workspace. */
export function ComposerTitle({ workspaceName, ...props }: ComposerTitleProps) {
  const { t } = useTranslation("quills");
  return (
    <Input
      unstyled
      className="text-base [&_input]:text-ellipsis"
      id="feedback-title"
      aria-label={t("feedback.postTitle")}
      placeholder={t("feedback.composer", { name: workspaceName })}
      {...props}
    />
  );
}
