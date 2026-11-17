import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input } from "../../../ui/upstream";

type Values = { mrr: number | null };
const toNumber = (v: unknown) => (v === "" || v === null ? null : Number(v));
/** At most two decimals, as cents allow. */
const cents = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;

export interface CompanyRevenueFormProps {
  /** The stored revenue in cents. */
  mrrCents: number | null;
  /** Gets the new revenue in cents; null clears it. */
  onSubmit: (mrrCents: number | null) => Promise<PortalProblem | void>;
}

/** A company's monthly revenue, entered in major units such as 1250.50 (#79). */
export function CompanyRevenueForm({
  mrrCents,
  onSubmit,
}: CompanyRevenueFormProps) {
  const { t } = useTranslation("quills");
  const amount = t("team-members.amount");
  const schema = z.object({
    mrr: z
      .number({ error: amount })
      .min(0, amount)
      .max(21474836, amount)
      .refine(cents, amount)
      .nullable(),
  });
  return (
    <PortalForm<Values>
      schema={schema}
      defaultValues={{ mrr: mrrCents === null ? null : mrrCents / 100 }}
      submitKey="team-members.saveRevenue"
      onSubmit={({ mrr }) =>
        onSubmit(mrr === null ? null : Math.round(mrr * 100))
      }
    >
      {(form) => (
        <Field invalid={Boolean(form.formState.errors.mrr)}>
          <FieldLabel htmlFor="member-company-mrr">
            {t("team-members.mrrLabel")}
          </FieldLabel>
          <Input
            id="member-company-mrr"
            inputMode="decimal"
            {...form.register("mrr", { setValueAs: toNumber })}
            aria-invalid={Boolean(form.formState.errors.mrr)}
          />
          {form.formState.errors.mrr?.message ? (
            <p role="alert">{form.formState.errors.mrr.message}</p>
          ) : null}
        </Field>
      )}
    </PortalForm>
  );
}
