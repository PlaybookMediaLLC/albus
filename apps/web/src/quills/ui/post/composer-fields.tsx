import { Controller, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { PublicField, RawFieldValue } from "../../core/composer-fields";
import { FormSelect } from "../form-select";
import { Checkbox, Field, FieldLabel, Input, Label } from "../upstream";
import { fieldsOfBoard } from "./composer-schema";

type Values = {
  boardId?: string;
  customFields?: Record<string, RawFieldValue>;
};

export interface ComposerFieldsProps<T extends Values> {
  /** The composer's boards; the fields of the one in the form's boardId show. */
  boards: ReadonlyArray<{ id: string; fields?: readonly PublicField[] }>;
  form: UseFormReturn<T>;
}

/** The public custom fields of the chosen board, under the details of the composer. */
export function ComposerFields<T extends Values>({
  boards,
  form,
}: ComposerFieldsProps<T>) {
  const { t } = useTranslation("quills");
  const typed = form as unknown as UseFormReturn<Values>;
  const fields = fieldsOfBoard(boards, typed.watch("boardId"));
  if (!fields.length) return null;
  const labelOf = (field: PublicField) =>
    field.required
      ? `${field.label} ${t("board-fields.requiredMark")}`
      : field.label;
  return (
    <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      {fields.map((field) => {
        const name = `customFields.${field.key}` as const;
        const error = typed.formState.errors.customFields?.[field.key]?.message;
        const alert = error ? (
          <p role="alert" className="text-xs text-destructive-foreground">
            {String(error)}
          </p>
        ) : null;
        if (field.type === "select")
          return (
            <FormSelect
              key={field.key}
              control={typed.control}
              name={name}
              label={labelOf(field)}
              options={[
                { value: undefined, label: t("board-fields.chooseOne") },
                ...(field.options ?? []).map((option) => ({
                  value: option,
                  label: option,
                })),
              ]}
            />
          );
        // A checkbox inside a Field would take the Field's (missing) label as its name.
        if (field.type === "checkbox")
          return (
            <div key={field.key} className="grid gap-1">
              <Label>
                <Controller
                  control={typed.control}
                  name={name}
                  render={({ field: input }) => (
                    <Checkbox
                      checked={input.value === true}
                      onCheckedChange={(checked) =>
                        input.onChange(checked === true)
                      }
                    />
                  )}
                />
                <span dir="auto">{labelOf(field)}</span>
              </Label>
              {alert}
            </div>
          );
        if (field.type === "multi_select")
          return (
            <fieldset key={field.key} className="grid gap-1">
              <legend className="text-sm font-medium" dir="auto">
                {labelOf(field)}
              </legend>
              <Controller
                control={typed.control}
                name={name}
                render={({ field: input }) => {
                  const chosen = Array.isArray(input.value) ? input.value : [];
                  return (
                    <>
                      {field.options?.map((option) => (
                        <Label key={option}>
                          <Checkbox
                            checked={chosen.includes(option)}
                            onCheckedChange={(checked) =>
                              input.onChange(
                                checked
                                  ? [...chosen, option]
                                  : chosen.filter((item) => item !== option),
                              )
                            }
                          />
                          <span dir="auto">{option}</span>
                        </Label>
                      ))}
                    </>
                  );
                }}
              />
              {alert}
            </fieldset>
          );
        const id = `composer-field-${field.key}`;
        return (
          <Field key={field.key} invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>
              <span dir="auto">{labelOf(field)}</span>
            </FieldLabel>
            <Input
              id={id}
              // Digits and dates follow the page; only free text keeps its own direction.
              dir={field.type === "text" ? "auto" : undefined}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : "text"
              }
              {...(field.type === "number" && { step: "any" })}
              {...typed.register(name)}
            />
            {alert}
          </Field>
        );
      })}
    </div>
  );
}
