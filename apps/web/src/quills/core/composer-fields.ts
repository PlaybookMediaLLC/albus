// Board custom fields in the customer composer (issue #71): the form keeps raw input values, the
// API takes typed ones. Pure: no React.

export type FieldType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "checkbox"
  | "date";
export interface PublicField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}
/** Form input: text, number, date and select as strings, a checkbox as a boolean, multi-select as a list. */
export type RawFieldValue = string | boolean | string[] | undefined;
export type FieldValue = string | number | boolean | string[];

const empty = (value: RawFieldValue) =>
  value === undefined ||
  value === false ||
  (typeof value === "string" && !value.trim()) ||
  (Array.isArray(value) && !value.length);

/** The values to send: empty inputs are left out, numbers are numbers. */
export function toFieldValues(
  fields: readonly PublicField[],
  raw: Record<string, RawFieldValue> | undefined,
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of fields) {
    const value = raw?.[field.key];
    if (empty(value)) continue;
    values[field.key] =
      field.type === "number"
        ? Number(value)
        : typeof value === "string"
          ? value.trim()
          : value!;
  }
  return values;
}

/** The required fields without a value; a required checkbox must be checked. */
export const missingFields = (
  fields: readonly PublicField[],
  raw: Record<string, RawFieldValue> | undefined,
) => fields.filter((field) => field.required && empty(raw?.[field.key]));
