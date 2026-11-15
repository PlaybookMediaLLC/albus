import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import {
  Field,
  FieldDescription,
  FieldLabel,
  Textarea,
} from "../../../ui/upstream";

export interface SpamFilterFormProps {
  senders: readonly string[];
  onSubmit: (senders: string[]) => Promise<PortalProblem | void>;
}

/** The entries of a text with one or more entries on each line, without empty entries. */
const entries = (text: string) =>
  text
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

/** The trusted senders: addresses and domains that the spam filter never holds. */
export function SpamFilterForm({ senders, onSubmit }: SpamFilterFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const schema = z.object({
    senders: z
      .string()
      .refine(
        (text) =>
          entries(text).length <= 500 &&
          entries(text).every((entry) => entry.length <= 320),
        t("settings-conversations.moderation.sendersInvalid"),
      ),
  });
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ senders: senders.join("\n") }}
      submitKey="settings-conversations.save"
      className="max-w-none gap-3 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={async (values) => {
        const problem = await onSubmit(entries(values.senders));
        // The form has one field. An API issue of any entry shows at it.
        return problem?.issues
          ? {
              ...problem,
              issues: problem.issues.map((issue) => ({
                ...issue,
                path: "senders",
              })),
            }
          : problem;
      }}
    >
      {(form) => {
        const error = form.formState.errors.senders?.message;
        return (
          <Field invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>
              {t("settings-conversations.moderation.senders")}
            </FieldLabel>
            <FieldDescription>
              {t("settings-conversations.moderation.sendersText")}
            </FieldDescription>
            <Textarea
              id={id}
              rows={4}
              placeholder={t(
                "settings-conversations.moderation.sendersPlaceholder",
              )}
              aria-invalid={Boolean(error)}
              {...form.register("senders")}
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
