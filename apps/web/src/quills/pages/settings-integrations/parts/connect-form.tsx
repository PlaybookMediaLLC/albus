import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input } from "../../../ui/upstream";
import type { ConnectField } from "../connectors";

export interface ConnectFormProps {
  fields: readonly ConnectField[];
  onSubmit: (values: Record<string, string>) => Promise<PortalProblem | void>;
}

/** The values that a key or webhook provider needs. The API checks them with the provider. */
export function ConnectForm({ fields, onSubmit }: ConnectFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const required = z
    .string()
    .trim()
    .min(1, t("settings-connections.integrations.required"));
  const schema = z.object(
    Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.optional ? z.string().trim() : required,
      ]),
    ),
  );
  return (
    <PortalForm
      schema={schema}
      defaultValues={Object.fromEntries(fields.map(({ name }) => [name, ""]))}
      submitKey="settings-connections.integrations.save"
      className="max-w-none gap-3"
      onSubmit={onSubmit}
    >
      {(form) =>
        fields.map((field, index) => {
          const error = form.formState.errors[field.name]?.message;
          return (
            <Field key={field.name} invalid={Boolean(error)}>
              <FieldLabel htmlFor={`${id}-${field.name}`}>
                {t(field.labelKey)}
                {field.optional ? (
                  <span className="font-normal text-muted-foreground">
                    {t("settings-connections.integrations.optional")}
                  </span>
                ) : null}
              </FieldLabel>
              <Input
                id={`${id}-${field.name}`}
                type={field.secret ? "password" : "text"}
                autoComplete="off"
                autoFocus={index === 0}
                aria-invalid={Boolean(error)}
                {...form.register(field.name)}
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
