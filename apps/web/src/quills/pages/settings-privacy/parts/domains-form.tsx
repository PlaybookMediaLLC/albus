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

export interface DomainsFormProps {
  domains: readonly string[];
  onSubmit: (domains: string[]) => Promise<PortalProblem | void>;
}

/** The domains in a comma-separated text, without empty entries. */
const splitDomains = (text: string) =>
  text
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);

/** The email domains whose signed-in people may open a private portal. */
export function DomainsForm({ domains, onSubmit }: DomainsFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const schema = z.object({
    domains: z
      .string()
      .refine(
        (text) => splitDomains(text).every((domain) => domain.length <= 253),
        t("settings-product.privacy.domainTooLong"),
      ),
  });
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ domains: domains.join(", ") }}
      submitKey="settings-product.dialog.save"
      className="max-w-none gap-3 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={async (values) => {
        const problem = await onSubmit(splitDomains(values.domains));
        // The form has one field. An API issue of any domain ("allowedDomains.2") shows at it.
        return problem?.issues
          ? {
              ...problem,
              issues: problem.issues.map((issue) => ({
                ...issue,
                path: "domains",
              })),
            }
          : problem;
      }}
    >
      {(form) => {
        const error = form.formState.errors.domains?.message;
        return (
          <Field invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>
              {t("settings-product.privacy.domains")}
            </FieldLabel>
            <FieldDescription>
              {t("settings-product.privacy.domainsText")}
            </FieldDescription>
            <Input
              id={id}
              autoComplete="off"
              placeholder={t("settings-product.privacy.domainsPlaceholder")}
              aria-invalid={Boolean(error)}
              {...form.register("domains")}
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
