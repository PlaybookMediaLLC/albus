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

export interface SsoUrlFormProps {
  ssoUrl: string | null;
  onSubmit: (ssoUrl: string) => Promise<PortalProblem | void>;
}

/** The host app's login page for SSO sign-in to the portal (gap G-24). */
export function SsoUrlForm({ ssoUrl, onSubmit }: SsoUrlFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const schema = z.object({
    ssoUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => /^https?:\/\/\S+$/i.test(value),
        t("settings-product.privacy.ssoUrlInvalid"),
      ),
  });
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ ssoUrl: ssoUrl ?? "" }}
      submitKey="settings-product.privacy.saveSsoUrl"
      className="max-w-none gap-3 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={(values) => onSubmit(values.ssoUrl)}
    >
      {(form) => {
        const error = form.formState.errors.ssoUrl?.message;
        return (
          <Field invalid={Boolean(error)}>
            <FieldLabel htmlFor={`${id}-sso`}>
              {t("settings-product.privacy.ssoUrl")}
            </FieldLabel>
            <Input
              id={`${id}-sso`}
              type="url"
              autoComplete="off"
              placeholder={t("settings-product.privacy.ssoUrlPlaceholder")}
              aria-invalid={Boolean(error)}
              {...form.register("ssoUrl")}
            />
            <FieldDescription>
              {t("settings-product.privacy.ssoUrlText")}
            </FieldDescription>
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
