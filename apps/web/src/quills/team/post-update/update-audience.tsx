import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox, Field, FieldLabel, Input, Label } from "../../ui/upstream";

export interface UpdateAudienceProps {
  segments: { id: string; name: string }[];
  segmentIds: string[];
  onSegmentsChange: (segmentIds: string[]) => void;
  /** The language tags as typed: comma-separated, such as "fr, pt-br". */
  languages: string;
  onLanguagesChange: (languages: string) => void;
}

/** Who among the followers hears the update: segments and languages. Empty means everyone. */
export function UpdateAudience(props: UpdateAudienceProps) {
  const { t } = useTranslation("quills");
  const legend = useId();
  const languages = useId();
  return (
    <>
      {props.segments.length ? (
        <div role="group" aria-labelledby={legend} className="grid gap-2">
          <p id={legend} className="text-sm font-medium">
            {t("team-post.updateSegments")}
          </p>
          {props.segments.map((segment) => (
            <Label key={segment.id}>
              <Checkbox
                checked={props.segmentIds.includes(segment.id)}
                onCheckedChange={(checked) =>
                  props.onSegmentsChange(
                    checked
                      ? [...props.segmentIds, segment.id]
                      : props.segmentIds.filter((id) => id !== segment.id),
                  )
                }
              />
              {segment.name}
            </Label>
          ))}
        </div>
      ) : null}
      <Field>
        <FieldLabel htmlFor={languages}>
          {t("team-post.updateLanguages")}
        </FieldLabel>
        <Input
          id={languages}
          autoComplete="off"
          placeholder={t("team-post.updateLanguagesHint")}
          value={props.languages}
          onChange={(event) => props.onLanguagesChange(event.target.value)}
        />
      </Field>
    </>
  );
}
