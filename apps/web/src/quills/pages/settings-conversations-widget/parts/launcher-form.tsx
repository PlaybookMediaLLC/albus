import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input } from "../../../ui/upstream";

const schema = z.object({
  launcherLabel: z.string().trim().max(60),
  launcherGreeting: z.string().trim().max(120),
});
export type LauncherValues = z.infer<typeof schema>;

export interface LauncherFormProps {
  values: LauncherValues;
  onSubmit: (values: LauncherValues) => Promise<PortalProblem | void>;
}

/** The text of the widget launcher button and its greeting. */
export function LauncherForm({ values, onSubmit }: LauncherFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const fields = [
    ["launcherLabel", "settings-conversations.widget.label"],
    ["launcherGreeting", "settings-conversations.widget.greeting"],
  ] as const;
  return (
    <PortalForm
      schema={schema}
      defaultValues={values}
      submitKey="settings-conversations.save"
      className="max-w-none gap-4 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={onSubmit}
    >
      {(form) =>
        fields.map(([name, label]) => {
          const error = form.formState.errors[name]?.message;
          return (
            <Field key={name} invalid={Boolean(error)}>
              <FieldLabel htmlFor={`${id}-${name}`}>{t(label)}</FieldLabel>
              <Input
                id={`${id}-${name}`}
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
        })
      }
    </PortalForm>
  );
}
