// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { HTTPException } from "hono/http-exception";
import { z } from "../../openapi";

// Board custom fields (issue #71). A board's fields live in boards.settings.customFields; a post's
// values live in posts.custom_field_values, keyed by field key. An internal field is for teammates
// only: customers never see it, set it or need it. Pure: no database.

export const FIELD_TYPES = [
  "text",
  "number",
  "select",
  "multi_select",
  "checkbox",
  "date",
] as const;
const MAX_FIELDS = 20;
const MAX_OPTIONS = 50;
const MAX_TEXT = 2000;

const option = z.string().trim().min(1).max(100);
export const fieldDefinition = z
  .object({
    key: z
      .string()
      .regex(
        /^[a-z][a-z0-9_]{0,39}$/,
        "Use 1 to 40 lowercase letters, digits or underscores, starting with a letter",
      ),
    label: z.string().trim().min(1).max(100),
    type: z.enum(FIELD_TYPES),
    required: z.boolean().default(false),
    internal: z.boolean().default(false),
    options: z.array(option).max(MAX_OPTIONS).optional(),
  })
  .superRefine((field, ctx) => {
    const choice = field.type === "select" || field.type === "multi_select";
    if (choice && !field.options?.length)
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "A select field needs at least one option",
      });
    if (!choice && field.options)
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Only a select field has options",
      });
    if (field.options && new Set(field.options).size !== field.options.length)
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Options must be unique",
      });
  });
export type Field = z.output<typeof fieldDefinition>;

export const fieldDefinitions = z
  .array(fieldDefinition)
  .max(MAX_FIELDS)
  .refine(
    (fields) => new Set(fields.map((f) => f.key)).size === fields.length,
    "Field keys must be unique",
  );

/** The public view of a field: what the portal and the widget render. */
export const publicField = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

const value = z.union([
  z.string().max(MAX_TEXT),
  z.number(),
  z.boolean(),
  z.array(z.string().max(100)).max(MAX_OPTIONS),
]);
export type FieldValue = z.output<typeof value>;
export type FieldValues = Record<string, FieldValue>;

/** Request values: null clears a value on an update. */
export const fieldValuesInput = z
  .record(z.string().max(40), value.nullable())
  .refine(
    (values) => Object.keys(values).length <= MAX_FIELDS,
    `At most ${MAX_FIELDS} fields`,
  )
  .openapi({
    description:
      "Values of the board's custom fields, keyed by field key: a string for text, select and date (YYYY-MM-DD), a number, a boolean for a checkbox, and a list of options for multi-select.",
  });

/**
 * One value in a response, in the board's field order. Responses use closed objects only
 * (framework/contract-probe.ts), so a multi-select value is `values` and any other is `value`.
 */
export const fieldValueItem = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]).nullable().openapi({
    description:
      "A text, select or date (YYYY-MM-DD) string, a number, or a checkbox boolean; null for multi-select",
  }),
  values: z.array(z.string()).nullable().openapi({
    description:
      "The chosen options of a multi-select field; null for other types",
  }),
});
export type FieldValueItem = z.output<typeof fieldValueItem>;

/** The values as response items, in the order of `fields`. */
export const toItems = (
  fields: Field[],
  values: FieldValues,
): FieldValueItem[] =>
  fields.flatMap((field) => {
    const stored = values[field.key];
    if (stored === undefined) return [];
    return [
      Array.isArray(stored)
        ? { key: field.key, value: null, values: stored }
        : { key: field.key, value: stored, values: null },
    ];
  });

/** The board's fields as stored. Malformed settings read as no fields. */
export function fieldsOf(settings: unknown): Field[] {
  const stored = (settings as { customFields?: unknown } | null)?.customFields;
  const parsed = fieldDefinitions.safeParse(stored ?? []);
  return parsed.success ? parsed.data : [];
}

const invalid = (message: string) => new HTTPException(400, { message });
const isDate = (text: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(text) &&
  new Date(`${text}T00:00:00Z`).toISOString().startsWith(text);

/** The value in its stored form, or undefined when it is empty. Throws 400 for the wrong type. */
function checkOne(field: Field, input: FieldValue): FieldValue | undefined {
  const wrong = () =>
    invalid(
      `Field "${field.key}" needs a ${field.type.replace("_", "-")} value`,
    );
  switch (field.type) {
    case "text":
      if (typeof input !== "string") throw wrong();
      return input.trim() || undefined;
    case "number":
      if (typeof input !== "number" || !Number.isFinite(input)) throw wrong();
      return input;
    case "checkbox":
      if (typeof input !== "boolean") throw wrong();
      return input;
    case "date":
      if (typeof input !== "string" || !isDate(input)) throw wrong();
      return input;
    case "select":
      if (typeof input !== "string" || !field.options!.includes(input))
        throw invalid(`Field "${field.key}" needs one of its options`);
      return input;
    case "multi_select": {
      if (
        !Array.isArray(input) ||
        input.some((item) => !field.options!.includes(item))
      )
        throw invalid(`Field "${field.key}" needs a list of its options`);
      const unique = [...new Set(input)];
      return unique.length ? unique : undefined;
    }
  }
}

/** A required checkbox must be checked; any other required field must have a value. */
const missing = (field: Field, stored: FieldValue | undefined) =>
  stored === undefined || (field.type === "checkbox" && stored !== true);

const isRecord = (input: unknown): input is Record<string, unknown> =>
  !!input && typeof input === "object" && !Array.isArray(input);

/**
 * Validated values for a new post, or for an update merged onto `current`. 400 for an unknown or
 * internal key from a customer, a value of the wrong type, or a required field without a value.
 * `team` callers set internal fields too, and their required internal fields are checked.
 * `requireAll` false skips the required check, for example for an import of older posts.
 * Stored values of removed fields are kept, so changing a board's fields never deletes data.
 */
export function checkValues(
  fields: Field[],
  input: Record<string, FieldValue | null> | undefined,
  options: { team: boolean; current?: unknown; requireAll?: boolean },
): FieldValues | null {
  const allowed = fields.filter((field) => options.team || !field.internal);
  const merged = (
    isRecord(options.current) ? { ...options.current } : {}
  ) as FieldValues;
  for (const [key, raw] of Object.entries(input ?? {})) {
    const field = allowed.find((f) => f.key === key);
    if (!field) throw invalid(`Unknown field "${key}"`);
    const next = raw === null ? undefined : checkOne(field, raw);
    if (next === undefined) delete merged[key];
    else merged[key] = next;
  }
  if (options.requireAll !== false) {
    const valid = valuesFor(allowed, merged);
    for (const field of allowed)
      if (field.required && missing(field, valid[field.key]))
        throw invalid(`Field "${field.key}" is required`);
  }
  return Object.keys(merged).length ? merged : null;
}

/** Stored values that still match these fields and types; others are kept but not shown. */
export function valuesFor(fields: Field[], stored: unknown): FieldValues {
  if (!isRecord(stored)) return {};
  const values: FieldValues = {};
  for (const field of fields) {
    const raw = stored[field.key];
    if (raw === undefined || raw === null) continue;
    const parsed = value.safeParse(raw);
    if (!parsed.success) continue;
    try {
      const checked = checkOne(field, parsed.data);
      if (checked !== undefined) values[field.key] = checked;
    } catch {
      // A value from before a field changed type is not shown.
    }
  }
  return values;
}

/** The values a caller may read: every field for a teammate, public fields for a customer. */
export const visibleValues = (
  settings: unknown,
  stored: unknown,
  team: boolean,
): FieldValues =>
  valuesFor(
    fieldsOf(settings).filter((field) => team || !field.internal),
    stored,
  );

/** A teammate's view of a post's values, as response items. */
export const teamItems = (settings: unknown, stored: unknown) =>
  toItems(fieldsOf(settings), visibleValues(settings, stored, true));
