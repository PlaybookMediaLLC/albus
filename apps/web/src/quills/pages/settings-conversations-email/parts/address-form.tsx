import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { FormSelect } from "../../../ui/form-select";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input } from "../../../ui/upstream";

const modules = ["support", "feedback", "changelog"] as const;
export type AddressValues = {
  address: string;
  module: (typeof modules)[number];
};

export interface AddressFormProps {
  onSubmit: (values: AddressValues) => Promise<PortalProblem | void>;
}

/** A new sending address and the area that sends from it. */
export function AddressForm({ onSubmit }: AddressFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const schema = z.object({
    address: z
      .string()
      .trim()
      .max(320)
      .email(t("settings-conversations.email.addressInvalid")),
    module: z.enum(modules),
  });
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ address: "", module: "support" }}
      submitKey="settings-conversations.add"
      className="max-w-none gap-4 px-6 pb-6 [&_button[type=submit]]:self-end"
      onSubmit={onSubmit}
    >
      {(form) => {
        const error = form.formState.errors.address?.message;
        return (
          <>
            <Field invalid={Boolean(error)}>
              <FieldLabel htmlFor={id}>
                {t("settings-conversations.email.address")}
              </FieldLabel>
              <Input
                id={id}
                type="email"
                autoComplete="off"
                autoFocus
                placeholder={t(
                  "settings-conversations.email.addressPlaceholder",
                )}
                aria-invalid={Boolean(error)}
                {...form.register("address")}
              />
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {String(error)}
                </p>
              ) : null}
            </Field>
            <FormSelect
              control={form.control}
              name="module"
              label={t("settings-conversations.email.module")}
              options={[
                {
                  value: "support",
                  label: t("settings-conversations.email.modules.support"),
                },
                {
                  value: "feedback",
                  label: t("settings-conversations.email.modules.feedback"),
                },
                {
                  value: "changelog",
                  label: t("settings-conversations.email.modules.changelog"),
                },
              ]}
            />
          </>
        );
      }}
    </PortalForm>
  );
}
