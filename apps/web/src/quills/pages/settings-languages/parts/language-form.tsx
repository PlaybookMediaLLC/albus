import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { FormSelect } from "../../../ui/form-select";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input, Textarea } from "../../../ui/upstream";
import { helpCenterLocales, type HelpCenterLocale } from "../locales";

export interface LanguageValues {
  locale: HelpCenterLocale;
  homepageTitle: string;
  homepageDescription: string;
  searchPlaceholder: string;
}

export interface LanguageFormProps {
  defaultValues: LanguageValues;
  /** The languages to choose from. Without them, the form edits the text of one language. */
  options?: readonly { value: HelpCenterLocale; label: string }[];
  onSubmit: (values: LanguageValues) => Promise<PortalProblem | void>;
}

const fields = [
  ["homepageTitle", "settings-workspace.languages.homepageTitle", 200],
  [
    "homepageDescription",
    "settings-workspace.languages.homepageDescription",
    500,
  ],
  ["searchPlaceholder", "settings-workspace.languages.searchPlaceholder", 200],
] as const;

/** A help-center language and the homepage text in that language. */
export function LanguageForm({
  defaultValues,
  options,
  onSubmit,
}: LanguageFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const schema = z.object({
    locale: z.enum(helpCenterLocales),
    homepageTitle: z
      .string()
      .trim()
      .min(1, t("settings-workspace.languages.titleRequired"))
      .max(200),
    homepageDescription: z.string().trim().max(500),
    searchPlaceholder: z.string().trim().max(200),
  });
  return (
    <PortalForm
      schema={schema}
      defaultValues={defaultValues}
      submitKey="settings-workspace.languages.save"
      className="max-w-none gap-3"
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          {options ? (
            <FormSelect
              control={form.control}
              name="locale"
              label={t("settings-workspace.languages.language")}
              options={options}
            />
          ) : null}
          {fields.map(([name, labelKey, max]) => {
            const error = form.formState.errors[name]?.message;
            const Control = name === "homepageDescription" ? Textarea : Input;
            return (
              <Field key={name} invalid={Boolean(error)}>
                <FieldLabel htmlFor={`${id}-${name}`}>{t(labelKey)}</FieldLabel>
                <Control
                  id={`${id}-${name}`}
                  maxLength={max}
                  autoComplete="off"
                  aria-invalid={Boolean(error)}
                  {...form.register(name)}
                />
                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {String(error)}
                  </p>
                ) : null}
              </Field>
            );
          })}
        </>
      )}
    </PortalForm>
  );
}
