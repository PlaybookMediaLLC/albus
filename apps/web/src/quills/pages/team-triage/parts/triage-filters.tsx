import { useTranslation } from "react-i18next";
import { z } from "zod";
import { FormSelect } from "../../../ui/form-select";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input } from "../../../ui/upstream";
import type { TriageFilterValues } from "../triage-filter-query";

const toNumber = (value: unknown) =>
  value === "" || value === null ? null : Number(value);
/** At most two decimals, as cents allow. */
const cents = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export interface TriageFiltersProps {
  segments: { id: string; name: string }[];
  /** The team has scoring factors, so the score filter means something. */
  withScore: boolean;
  /** The teammate holds quills:view_revenue: the revenue filter shows. */
  withRevenue: boolean;
  /** The applied filters: the form starts with them, also after the list reloads. */
  value: TriageFilterValues;
  onApply: (values: TriageFilterValues) => void;
}

/** Narrows triage to requests with enough votes, customer revenue or team score, or a segment. */
export function TriageFilters({
  segments,
  withScore,
  withRevenue,
  value,
  onApply,
}: TriageFiltersProps) {
  const { t } = useTranslation("quills");
  const whole = t("team-triage.wholeNumber");
  // The bounds of the listQuillsPosts value filters. An empty field is no filter.
  const schema = z.object({
    minVotes: z
      .number({ error: whole })
      .int(whole)
      .min(0)
      .max(1000000)
      .nullable(),
    minMrr: z
      .number({ error: t("team-triage.amount") })
      .min(0)
      .max(21474836)
      .refine(cents, t("team-triage.amount"))
      .nullable(),
    minScore: z
      .number({ error: whole })
      .int(whole)
      .min(-9999)
      .max(9999)
      .nullable(),
    segmentId: z.string(),
  });
  const numbers = [
    { name: "minVotes", labelKey: "team-triage.minVotes" },
    ...(withRevenue
      ? [{ name: "minMrr", labelKey: "team-triage.minMrr" } as const]
      : []),
    ...(withScore
      ? [{ name: "minScore", labelKey: "team-triage.minScore" } as const]
      : []),
  ] as const;
  return (
    <PortalForm<TriageFilterValues>
      schema={schema}
      defaultValues={value}
      submitKey="team-triage.applyFilters"
      submitVariant="secondary"
      className="max-w-none border-b border-border px-4 py-3"
      onSubmit={async (values) => onApply(values)}
    >
      {(form) => (
        <div className="grid gap-3 sm:grid-cols-4">
          {numbers.map((field) => (
            <Field
              key={field.name}
              invalid={Boolean(form.formState.errors[field.name])}
            >
              <FieldLabel htmlFor={`team-triage-${field.name}`}>
                {t(field.labelKey)}
              </FieldLabel>
              <Input
                id={`team-triage-${field.name}`}
                inputMode="decimal"
                {...form.register(field.name, { setValueAs: toNumber })}
                aria-invalid={Boolean(form.formState.errors[field.name])}
              />
              {form.formState.errors[field.name]?.message ? (
                <p role="alert">{form.formState.errors[field.name]!.message}</p>
              ) : null}
            </Field>
          ))}
          <FormSelect
            control={form.control}
            name="segmentId"
            label={t("team-triage.segment")}
            options={[
              { value: "", label: t("team-triage.anySegment") },
              ...segments.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </div>
      )}
    </PortalForm>
  );
}
