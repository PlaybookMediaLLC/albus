import type { FeedbackField } from "./types.js";

// Board custom fields in the feedback composer (issue #71): raw input values, typed for the API.

/** Text, number, date and select as strings, a checkbox as a boolean, multi-select as a list. */
export type RawFieldValue = string | boolean | readonly string[] | undefined;
export type FieldValue = string | number | boolean | string[];

const empty = (value: RawFieldValue) =>
  value === undefined ||
  value === false ||
  (typeof value === "string" && !value.trim()) ||
  (Array.isArray(value) && !value.length);

/** The values to send: empty inputs are left out, numbers are numbers. */
export function toFieldValues(
  fields: readonly FeedbackField[],
  raw: Readonly<Record<string, RawFieldValue>>,
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of fields) {
    const value = raw[field.key];
    if (empty(value)) continue;
    values[field.key] =
      field.type === "number"
        ? Number(value)
        : typeof value === "string"
          ? value.trim()
          : Array.isArray(value)
            ? [...value]
            : (value as boolean);
  }
  return values;
}

/** The required fields without a value; a required checkbox must be checked. */
export const missingFields = (
  fields: readonly FeedbackField[],
  raw: Readonly<Record<string, RawFieldValue>>,
) => fields.filter((field) => field.required && empty(raw[field.key]));
