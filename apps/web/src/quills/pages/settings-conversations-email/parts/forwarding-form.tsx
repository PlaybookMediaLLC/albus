import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import {
  Field,
  FieldDescription,
  FieldLabel,
  Input,
} from "../../../ui/upstream";

export interface ForwardingFormProps {
  target: string | null;
  onSubmit: (forwardingTarget: string) => Promise<PortalProblem | void>;
}

/** The address that receives a copy of each inbound support email. */
export function ForwardingForm({ target, onSubmit }: ForwardingFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const schema = z.object({
    forwardingTarget: z
      .string()
      .trim()
      .max(320)
      .email(t("settings-conversations.email.addressInvalid")),
  });
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ forwardingTarget: target ?? "" }}
      submitKey="settings-conversations.save"
      className="max-w-none gap-3 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={(values) => onSubmit(values.forwardingTarget)}
    >
      {(form) => {
        const error = form.formState.errors.forwardingTarget?.message;
        return (
          <Field invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>
              {t("settings-conversations.email.forward")}
            </FieldLabel>
            <FieldDescription>
              {t("settings-conversations.email.forwardText")}
            </FieldDescription>
            <Input
              id={id}
              type="email"
              autoComplete="off"
              placeholder={t("settings-conversations.email.addressPlaceholder")}
              aria-invalid={Boolean(error)}
              {...form.register("forwardingTarget")}
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
