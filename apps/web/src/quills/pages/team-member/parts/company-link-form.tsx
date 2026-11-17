import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input } from "../../../ui/upstream";

type Values = { name: string };

export interface CompanyLinkFormProps {
  /** Gets the company name; the API attaches that company, created when missing. */
  onSubmit: (name: string) => Promise<PortalProblem | void>;
}

/** The company a customer belongs to, by name (case-insensitive). */
export function CompanyLinkForm({ onSubmit }: CompanyLinkFormProps) {
  const { t } = useTranslation("quills");
  // The bounds of setQuillsUserCompany.
  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("team-members.companyNameRequired"))
      .max(200),
  });
  return (
    <PortalForm<Values>
      schema={schema}
      defaultValues={{ name: "" }}
      submitKey="team-members.saveCompany"
      onSubmit={({ name }) => onSubmit(name)}
    >
      {(form) => (
        <Field invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="member-company-name">
            {t("team-members.companyName")}
          </FieldLabel>
          <Input
            id="member-company-name"
            {...form.register("name")}
            aria-invalid={Boolean(form.formState.errors.name)}
          />
          {form.formState.errors.name?.message ? (
            <p role="alert">{form.formState.errors.name.message}</p>
          ) : null}
        </Field>
      )}
    </PortalForm>
  );
}
