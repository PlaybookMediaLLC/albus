// The board field editor's rows and the API's field list. Pure: no React.

export const FIELD_TYPES = [
  "text",
  "number",
  "select",
  "multi_select",
  "checkbox",
  "date",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
export interface BoardField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  internal: boolean;
  options?: string[];
}
/** A row of the form: options as text, one per line. */
export interface FieldRow {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  internal: boolean;
  options: string;
}

export const isChoice = (type: FieldType) =>
  type === "select" || type === "multi_select";

export const toRows = (fields: readonly BoardField[]): FieldRow[] =>
  fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    internal: field.internal,
    options: (field.options ?? []).join("\n"),
  }));

/** A key from the label, or field_N when the label has no Latin letter to start one. */
export function keyFrom(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return /^[a-z]/.test(slug) ? slug : `field_${index + 1}`;
}

export const toFields = (rows: readonly FieldRow[]): BoardField[] =>
  rows.map((row, index) => ({
    key: row.key.trim() || keyFrom(row.label, index),
    label: row.label.trim(),
    type: row.type,
    required: row.required,
    internal: row.internal,
    ...(isChoice(row.type) && {
      options: [
        ...new Set(
          row.options
            .split("\n")
            .map((option) => option.trim())
            .filter(Boolean),
        ),
      ],
    }),
  }));
