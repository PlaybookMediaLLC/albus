import { useTranslation } from "react-i18next";
import { formatFieldValue } from "../../../core/custom-field-value";

export interface PostCustomFieldsProps {
  fields: ReadonlyArray<{
    key: string;
    label: string;
    value: string | number | boolean | null;
    values: string[] | null;
  }>;
}

/** The post's answers to its board's public custom fields. Nothing when it has none. */
export function PostCustomFields({ fields }: PostCustomFieldsProps) {
  const { t, i18n } = useTranslation("quills");
  if (!fields.length) return null;
  const labels = { yes: t("board-fields.yes"), no: t("board-fields.no") };
  return (
    <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
      {fields.map((field) => (
        <div key={field.key} className="contents">
          <dt className="text-muted-foreground" dir="auto">
            {field.label}
          </dt>
          <dd dir="auto">{formatFieldValue(field, labels, i18n.language)}</dd>
        </div>
      ))}
    </dl>
  );
}
