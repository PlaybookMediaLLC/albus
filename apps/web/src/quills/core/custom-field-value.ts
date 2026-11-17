/** A custom field value as text: a list joins its options, a number uses the reader's locale. */
export function formatFieldValue(
  item: {
    value: string | number | boolean | null;
    values: readonly string[] | null;
  },
  labels: { yes: string; no: string },
  locale: string,
) {
  const { value, values } = item;
  if (values) return values.join(", ");
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "number")
    return new Intl.NumberFormat(locale).format(value);
  return value ?? "";
}
