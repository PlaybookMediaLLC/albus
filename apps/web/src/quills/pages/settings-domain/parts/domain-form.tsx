import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import {
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../../../ui/upstream";

const schema = z.object({ domain: z.string().trim().min(1).max(253) });
export type DomainValues = z.infer<typeof schema>;

export interface DomainFormProps {
  onSubmit: (values: DomainValues) => Promise<PortalProblem | void>;
}

/** A host name for a custom domain. The API checks that it is a public host name. */
export function DomainForm({ onSubmit }: DomainFormProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ domain: "" }}
      submitKey="settings-workspace.domain.save"
      className="max-w-none gap-3"
      onSubmit={onSubmit}
    >
      {(form) => {
        const error = form.formState.errors.domain?.message;
        return (
          <Field invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>
              {t("settings-workspace.domain.domain")}
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id={id}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                maxLength={253}
                placeholder={t("settings-workspace.domain.placeholder")}
                aria-invalid={Boolean(error)}
                {...form.register("domain")}
              />
              <InputGroupAddon align="inline-start">
                <span className="font-mono text-xs text-muted-foreground">
                  {t("settings-workspace.domain.scheme")}
                </span>
              </InputGroupAddon>
            </InputGroup>
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
