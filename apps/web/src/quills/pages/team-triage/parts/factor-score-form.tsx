import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input } from "../../../ui/upstream";

export interface Factor {
  id: string;
  name: string;
  weight: number;
}
/** A post's value for each factor, 0 to 10; null clears it. */
export type FactorValues = Record<string, number | null>;

const value = z.number().int().min(0).max(10).nullable();
const toNumber = (v: unknown) => (v === "" || v === null ? null : Number(v));

export interface FactorScoreFormProps {
  factors: Factor[];
  values: { factorId: string; value: number }[];
  onSubmit: (values: FactorValues) => Promise<PortalProblem | void>;
}

/** One request's values, 0 to 10, for the team's scoring factors (#79). */
export function FactorScoreForm({
  factors,
  values,
  onSubmit,
}: FactorScoreFormProps) {
  const { t } = useTranslation("quills");
  const schema = z.object(
    Object.fromEntries(factors.map((f) => [f.id, value])),
  ) as unknown as z.ZodType<FactorValues, FactorValues>;
  const defaults = Object.fromEntries(
    factors.map((f) => [
      f.id,
      values.find((v) => v.factorId === f.id)?.value ?? null,
    ]),
  );
  return (
    <PortalForm<FactorValues>
      schema={schema}
      defaultValues={defaults}
      submitKey="team-triage.saveFactors"
      className="max-w-none"
      onSubmit={onSubmit}
    >
      {(form) => (
        <div className="grid gap-3 sm:grid-cols-4">
          {factors.map((factor) => (
            <Field
              key={factor.id}
              invalid={Boolean(form.formState.errors[factor.id])}
            >
              <FieldLabel htmlFor={`team-triage-factor-${factor.id}`}>
                {t("team-triage.factorValue", {
                  name: factor.name,
                  weight: factor.weight,
                })}
              </FieldLabel>
              <Input
                id={`team-triage-factor-${factor.id}`}
                inputMode="numeric"
                {...form.register(factor.id, { setValueAs: toNumber })}
                aria-invalid={Boolean(form.formState.errors[factor.id])}
              />
              {form.formState.errors[factor.id]?.message ? (
                <p role="alert">{form.formState.errors[factor.id]!.message}</p>
              ) : null}
            </Field>
          ))}
        </div>
      )}
    </PortalForm>
  );
}
