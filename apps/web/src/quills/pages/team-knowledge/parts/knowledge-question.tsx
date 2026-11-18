import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Button, Field, FieldLabel, Textarea } from "../../../ui/upstream";

const schema = z.object({ answer: z.string().trim().min(1).max(1000) });

export interface KnowledgeQuestionProps {
  question: string;
  suggestedAnswers: readonly string[];
  number: number;
  total: number;
  busy: boolean;
  onAnswer: (answer: string) => Promise<PortalProblem | void>;
  onSkip: () => void;
}

/** The AI's next question: an answer box, the suggested answers that fill it, and skip. */
export function KnowledgeQuestion(props: KnowledgeQuestionProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  return (
    <section
      aria-label={t("knowledge.question", {
        number: props.number,
        total: props.total,
      })}
      className="grid gap-2 rounded-lg border border-border px-4 py-3"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase">
        {t("knowledge.question", { number: props.number, total: props.total })}
      </p>
      <p className="font-medium">{props.question}</p>
      <PortalForm
        schema={schema}
        defaultValues={{ answer: "" }}
        submitKey="knowledge.send"
        className="max-w-none gap-3"
        onSubmit={(values) => props.onAnswer(values.answer)}
        footer={() => (
          <Button
            type="button"
            variant="ghost"
            disabled={props.busy}
            onClick={props.onSkip}
          >
            {t("knowledge.skip")}
          </Button>
        )}
      >
        {(form) => {
          const error = form.formState.errors.answer?.message;
          return (
            <>
              {props.suggestedAnswers.length ? (
                <div
                  role="group"
                  aria-label={t("knowledge.suggested")}
                  className="flex flex-wrap gap-2"
                >
                  {props.suggestedAnswers.map((suggested) => (
                    <Button
                      key={suggested}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        form.setValue("answer", suggested, {
                          shouldDirty: true,
                        })
                      }
                    >
                      {suggested}
                    </Button>
                  ))}
                </div>
              ) : null}
              <Field invalid={Boolean(error)}>
                <FieldLabel htmlFor={id}>{t("knowledge.answer")}</FieldLabel>
                <Textarea
                  id={id}
                  aria-invalid={Boolean(error)}
                  {...form.register("answer")}
                />
                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {String(error)}
                  </p>
                ) : null}
              </Field>
            </>
          );
        }}
      </PortalForm>
    </section>
  );
}
