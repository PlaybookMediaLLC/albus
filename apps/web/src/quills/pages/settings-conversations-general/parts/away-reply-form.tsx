import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Textarea } from "../../../ui/upstream";

const schema = z.object({ message: z.string().trim().min(1).max(1000) });
export type AwayReplyValues = z.infer<typeof schema>;

export interface AwayReplyFormProps {
  values: AwayReplyValues;
  onSubmit: (values: AwayReplyValues) => Promise<PortalProblem | void>;
}

/** The text of the automatic answer while the team is away. */
export function AwayReplyForm({ values, onSubmit }: AwayReplyFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  return (
    <PortalForm
      schema={schema}
      defaultValues={values}
      submitKey="settings-conversations.save"
      className="max-w-none gap-4 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={onSubmit}
    >
      {(form) => {
        const error = form.formState.errors.message?.message;
        return (
          <Field invalid={Boolean(error)}>
            <FieldLabel htmlFor={`${id}-message`}>
              {t("settings-conversations.general.awayMessage")}
            </FieldLabel>
            <Textarea
              id={`${id}-message`}
              rows={3}
              aria-invalid={Boolean(error)}
              {...form.register("message")}
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {String(error)}
              </p>
            ) : null}
          </Field>
        );
      }}
    </PortalForm>
  );
}
