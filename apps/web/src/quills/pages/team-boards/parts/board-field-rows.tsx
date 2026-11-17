import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormSelect } from "../../../ui/form-select";
import {
  Button,
  Checkbox,
  Field,
  FieldLabel,
  Input,
  Label,
  Textarea,
} from "../../../ui/upstream";
import { FIELD_TYPES, isChoice, type FieldRow } from "../board-fields";

const typeLabels = {
  text: "board-fields.types.text",
  number: "board-fields.types.number",
  select: "board-fields.types.select",
  multi_select: "board-fields.types.multi_select",
  checkbox: "board-fields.types.checkbox",
  date: "board-fields.types.date",
} as const;

const empty: FieldRow = {
  key: "",
  label: "",
  type: "text",
  required: false,
  internal: false,
  options: "",
};

/** A row field's validation or API message. */
const rowError = (message?: string) =>
  message ? (
    <p role="alert" className="text-xs text-destructive-foreground">
      {message}
    </p>
  ) : null;

export interface BoardFieldRowsProps {
  form: UseFormReturn<{ customFields: FieldRow[] }>;
}

/** The editable rows of the board field form, with add and remove. */
export function BoardFieldRows({ form }: BoardFieldRowsProps) {
  const { t } = useTranslation("quills");
  const rows = useFieldArray({ control: form.control, name: "customFields" });
  return (
    <div className="grid gap-4">
      {rows.fields.length ? null : (
        <p className="text-sm text-muted-foreground">
          {t("board-fields.none")}
        </p>
      )}
      {rows.fields.map((row, index) => {
        const type = form.watch(`customFields.${index}.type`);
        const label = form.watch(`customFields.${index}.label`);
        const errors = form.formState.errors.customFields?.[index];
        return (
          <fieldset
            key={row.id}
            className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
          >
            <Field invalid={Boolean(errors?.label)}>
              <FieldLabel>{t("board-fields.label")}</FieldLabel>
              <Input
                dir="auto"
                {...form.register(`customFields.${index}.label`)}
              />
              {rowError(errors?.label?.message)}
            </Field>
            <Field invalid={Boolean(errors?.key)}>
              <FieldLabel>{t("board-fields.key")}</FieldLabel>
              <Input
                dir="ltr"
                autoComplete="off"
                aria-describedby={`board-field-key-hint-${index}`}
                {...form.register(`customFields.${index}.key`)}
              />
              <p
                id={`board-field-key-hint-${index}`}
                className="text-xs text-muted-foreground"
              >
                {t("board-fields.keyHint")}
              </p>
              {rowError(errors?.key?.message)}
            </Field>
            <FormSelect
              control={form.control}
              name={`customFields.${index}.type`}
              label={t("board-fields.type")}
              options={FIELD_TYPES.map((value) => ({
                value,
                label: t(typeLabels[value]),
              }))}
            />
            <div className="grid content-end gap-2">
              <Label>
                <Controller
                  control={form.control}
                  name={`customFields.${index}.required`}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                {t("board-fields.required")}
              </Label>
              <Label>
                <Controller
                  control={form.control}
                  name={`customFields.${index}.internal`}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                {t("board-fields.internal")}
              </Label>
            </div>
            {isChoice(type) ? (
              <Field
                className="sm:col-span-2"
                invalid={Boolean(errors?.options)}
              >
                <FieldLabel>{t("board-fields.options")}</FieldLabel>
                <Textarea
                  dir="auto"
                  rows={3}
                  aria-describedby={`board-field-options-hint-${index}`}
                  {...form.register(`customFields.${index}.options`)}
                />
                <p
                  id={`board-field-options-hint-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  {t("board-fields.optionsHint")}
                </p>
                {rowError(errors?.options?.message)}
              </Field>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-self-start sm:col-span-2"
              onClick={() => rows.remove(index)}
            >
              {t("board-fields.remove", { label: label || index + 1 })}
            </Button>
          </fieldset>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        disabled={rows.fields.length >= 20}
        onClick={() => rows.append(empty)}
      >
        {t("board-fields.add")}
      </Button>
    </div>
  );
}
