import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { DraftChanges } from "./draft-changes";
import { Field, FieldLabel, Input, Textarea } from "../../../ui/upstream";

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(2000),
});
export type KnowledgeDraftValues = z.infer<typeof schema>;
export type KnowledgeAudience = "team" | "public";

export interface KnowledgeDraftProps {
  /** The stored draft. A change keeps the text that the teammate has not saved yet. */
  values: KnowledgeDraftValues;
  audience: KnowledgeAudience;
  onAudienceChange: (audience: KnowledgeAudience) => void;
  onSave: (values: KnowledgeDraftValues) => Promise<PortalProblem | void>;
  /** Each edit, saved or not: approve uses the text on screen. */
  onChange: (values: KnowledgeDraftValues) => void;
}

const audiences = {
  team: "knowledge.audienceTeam",
  public: "knowledge.audiencePublic",
} as const;

/** The draft to approve: the title and the content to edit, and who can use the snippet. */
export function KnowledgeDraft(props: KnowledgeDraftProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  return (
    <section className="grid gap-3 rounded-lg border border-border px-4 py-3">
      <PortalForm
        schema={schema}
        defaultValues={props.values}
        values={props.values}
        submitKey="knowledge.save"
        submitVariant="secondary"
        className="max-w-none gap-3"
        onSubmit={props.onSave}
      >
        {(form) => {
          const titleError = form.formState.errors.title?.message;
          const contentError = form.formState.errors.content?.message;
          return (
            <>
              <DraftChanges form={form} onChange={props.onChange} />
              <Field invalid={Boolean(titleError)}>
                <FieldLabel htmlFor={`${id}-title`}>
                  {t("knowledge.draftTitle")}
                </FieldLabel>
                <Input
                  id={`${id}-title`}
                  autoComplete="off"
                  aria-invalid={Boolean(titleError)}
                  {...form.register("title")}
                />
                {titleError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {String(titleError)}
                  </p>
                ) : null}
              </Field>
              <Field invalid={Boolean(contentError)}>
                <FieldLabel htmlFor={`${id}-content`}>
                  {t("knowledge.draftContent")}
                </FieldLabel>
                <Textarea
                  id={`${id}-content`}
                  rows={6}
                  aria-invalid={Boolean(contentError)}
                  {...form.register("content")}
                />
                {contentError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {String(contentError)}
                  </p>
                ) : null}
              </Field>
            </>
          );
        }}
      </PortalForm>
      <fieldset className="grid gap-1">
        <legend className="text-sm font-medium">
          {t("knowledge.audience")}
        </legend>
        {(Object.keys(audiences) as KnowledgeAudience[]).map((audience) => (
          <label key={audience} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`${id}-audience`}
              value={audience}
              checked={props.audience === audience}
              onChange={() => props.onAudienceChange(audience)}
            />
            {t(audiences[audience])}
          </label>
        ))}
      </fieldset>
    </section>
  );
}
