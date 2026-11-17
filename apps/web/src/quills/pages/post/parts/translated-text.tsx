import { useState } from "react";
import { useTranslation } from "react-i18next";
import { readsEnglish } from "../../../core/reader-locale";
import type { Viewer } from "../../../core/types";
import { useTranslatePortalContent } from "../../../hooks/feedback/use-translate-portal-content";
import { MarkdownContent } from "../../../ui/markdown-content";
import { useReaderLocale } from "../../../portal/runtime";

export interface TranslatedTextProps {
  workspaceId: string;
  viewer: Viewer;
  /** The post or the comment that holds the text. */
  target: { postId: string } | { commentId: string };
  content: string;
  className?: string;
  /** False when the instance has no AI provider; then no text offers a translation. */
  translatable?: boolean;
}

/**
 * A post or comment text with "Translate" when the reader's language (saved, else the browser's)
 * is not English. A translation is marked as one, and "Show original" brings the source back.
 * A post's translated title shows above its text.
 */
export function TranslatedText(props: TranslatedTextProps) {
  const { t } = useTranslation("quills");
  // The toggle belongs to one text: after an edit the new original shows.
  const [translatedFor, setTranslatedFor] = useState<string | null>(null);
  const on = translatedFor === props.content;
  const reader = useReaderLocale();
  const locale =
    props.translatable === false || readsEnglish(reader) ? null : reader;
  const translation = useTranslatePortalContent(
    {
      param: { workspace: on && locale ? props.workspaceId : "" },
      json: { ...props.target, locale: locale ?? "" },
    },
    props.viewer,
  );
  const shown = on ? translation.data : undefined;
  return (
    <>
      {shown ? (
        <p className="text-xs text-muted-foreground">
          {t("assist.translated")}
        </p>
      ) : null}
      {shown?.title ? (
        <p className="font-medium" dir="auto">
          {shown.title}
        </p>
      ) : null}
      <MarkdownContent
        customer
        content={shown?.content ?? props.content}
        className={props.className}
      />
      {locale ? (
        <button
          type="button"
          className="relative touch-hitbox justify-self-start rounded-sm text-xs text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring hover:text-foreground"
          onClick={() => setTranslatedFor(on ? null : props.content)}
        >
          {t(on ? "assist.showOriginal" : "assist.translate")}
        </button>
      ) : null}
      {on && translation.isFetching ? (
        <p role="status" className="text-xs text-muted-foreground">
          {t("assist.translating")}
        </p>
      ) : null}
      {on && translation.error ? (
        <p role="alert" className="text-xs text-destructive-foreground">
          {t("assist.translateFailed")}
        </p>
      ) : null}
    </>
  );
}
