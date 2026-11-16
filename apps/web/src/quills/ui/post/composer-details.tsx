import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "../upstream";

export type ComposerDetailsProps = ComponentProps<typeof Textarea>;

/** The details field of a composer; its placeholder asks for useful context. */
export function ComposerDetails(props: ComposerDetailsProps) {
  const { t } = useTranslation("quills");
  return (
    <Textarea
      unstyled
      className="text-sm text-muted-foreground [&_textarea]:resize-none"
      aria-label={t("feedback.content")}
      placeholder={t("feedback.detailsHint")}
      {...props}
    />
  );
}
