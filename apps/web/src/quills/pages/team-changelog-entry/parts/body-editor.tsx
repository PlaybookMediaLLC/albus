import { type Ref, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownContent } from "../../../ui/markdown-content";
import { Textarea, ToggleGroup, ToggleGroupItem } from "../../../ui/upstream";
import { CONTENT_MAX } from "../save-body";

export interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: Ref<HTMLTextAreaElement>;
  readOnly?: boolean;
}

/** The Markdown body of an entry, with a Write and Preview switch. */
export function BodyEditor({
  value,
  onChange,
  textareaRef,
  readOnly,
}: BodyEditorProps) {
  const { t } = useTranslation("quills");
  const [mode, setMode] = useState("write");
  return (
    <div className="grid gap-3">
      <ToggleGroup
        aria-label={t("team-changelog.editor.mode")}
        size="sm"
        value={[mode]}
        onValueChange={(next) => next[0] && setMode(String(next[0]))}
      >
        <ToggleGroupItem value="write">
          {t("team-changelog.editor.write")}
        </ToggleGroupItem>
        <ToggleGroupItem value="preview">
          {t("team-changelog.editor.preview")}
        </ToggleGroupItem>
      </ToggleGroup>
      {mode === "preview" ? (
        <MarkdownContent content={value} className="min-h-60" />
      ) : (
        <Textarea
          ref={textareaRef}
          aria-label={t("team-changelog.editor.body")}
          placeholder={t("team-changelog.editor.bodyPlaceholder")}
          maxLength={CONTENT_MAX}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          unstyled
          className="w-full text-base leading-7 [&_textarea]:min-h-60 [&_textarea]:px-0"
        />
      )}
    </div>
  );
}
