import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { FormSelect } from "../../../ui/form-select";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input, Textarea } from "../../../ui/upstream";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  tone: z.enum(["friendly", "balanced", "formal"]),
  responseLength: z.enum(["concise", "balanced", "detailed"]),
  additionalInstructions: z.string().max(2000),
  productDescription: z.string().max(1000),
});
export type VoiceValues = z.infer<typeof schema>;

export interface VoiceFormProps {
  /** The stored values. A change keeps the text that the user has not saved yet. */
  values: VoiceValues;
  onSubmit: (values: VoiceValues) => Promise<PortalProblem | void>;
}

/** The name of the assistant and how it answers customers. */
export function VoiceForm({ values, onSubmit }: VoiceFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  return (
    <PortalForm
      schema={schema}
      defaultValues={values}
      values={values}
      submitKey="settings-conversations.save"
      className="max-w-none gap-4 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={onSubmit}
    >
      {(form) => {
        const nameError = form.formState.errors.name?.message;
        return (
          <>
            <Field invalid={Boolean(nameError)}>
              <FieldLabel htmlFor={`${id}-name`}>
                {t("settings-conversations.ai.name")}
              </FieldLabel>
              <Input
                id={`${id}-name`}
                autoComplete="off"
                aria-invalid={Boolean(nameError)}
                {...form.register("name")}
              />
              {nameError ? (
                <p role="alert" className="text-sm text-destructive">
                  {String(nameError)}
                </p>
              ) : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                control={form.control}
                name="tone"
                label={t("settings-conversations.ai.tone")}
                options={[
                  {
                    value: "friendly",
                    label: t("settings-conversations.ai.tones.friendly"),
                  },
                  {
                    value: "balanced",
                    label: t("settings-conversations.ai.tones.balanced"),
                  },
                  {
                    value: "formal",
                    label: t("settings-conversations.ai.tones.formal"),
                  },
                ]}
              />
              <FormSelect
                control={form.control}
                name="responseLength"
                label={t("settings-conversations.ai.length")}
                options={[
                  {
                    value: "concise",
                    label: t("settings-conversations.ai.lengths.concise"),
                  },
                  {
                    value: "balanced",
                    label: t("settings-conversations.ai.lengths.balanced"),
                  },
                  {
                    value: "detailed",
                    label: t("settings-conversations.ai.lengths.detailed"),
                  },
                ]}
              />
            </div>
            <Field>
              <FieldLabel htmlFor={`${id}-product`}>
                {t("settings-conversations.ai.product")}
              </FieldLabel>
              <Textarea
                id={`${id}-product`}
                rows={3}
                placeholder={t("settings-conversations.ai.productPlaceholder")}
                {...form.register("productDescription")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-instructions`}>
                {t("settings-conversations.ai.instructions")}
              </FieldLabel>
              <Textarea
                id={`${id}-instructions`}
                rows={4}
                placeholder={t(
                  "settings-conversations.ai.instructionsPlaceholder",
                )}
                {...form.register("additionalInstructions")}
              />
            </Field>
          </>
        );
      }}
    </PortalForm>
  );
}
