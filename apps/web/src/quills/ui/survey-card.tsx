import { IconXmarkOutline18 } from "nucleo-ui-essential-outline-18";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../core/types";
import { PortalForm } from "./portal-form";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  Field,
  FieldLabel,
  Textarea,
} from "./upstream";

export interface SurveyCardProps {
  survey: {
    type: string;
    question: string;
    options: string[];
    scale: { min: number; max: number } | null;
  };
  /** The answer was sent: show the thanks state. */
  done: boolean;
  /** The answer that the API takes: a score, a choice or only a comment. */
  onSubmit: (answer: {
    score?: number;
    choice?: string;
    comment?: string;
  }) => Promise<PortalProblem | void>;
  /** Hides the survey for this session. */
  onDismiss: () => void;
}

const option =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-border py-1.5 text-sm tabular-nums transition-colors hover:bg-muted/60 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring motion-reduce:transition-none";

/** One survey question with a score scale, choices or a text answer, and an optional comment. */
export function SurveyCard({
  survey,
  done,
  onSubmit,
  onDismiss,
}: SurveyCardProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const open = survey.type === "open";
  const { scale } = survey;
  // The comment and the send button wait for an answer, so the prompt stays one short card.
  const [picked, setPicked] = useState(open);
  const answers = scale
    ? Array.from({ length: scale.max - scale.min + 1 }, (_, i) =>
        String(scale.min + i),
      )
    : survey.options;
  const schema = z
    .object({ answer: z.string(), comment: z.string().trim().max(2000) })
    .refine((values) => Boolean(open ? values.comment : values.answer), {
      path: [open ? "comment" : "answer"],
      message: t(open ? "surveys.card.writeAnswer" : "surveys.card.required"),
    });
  return (
    <Card render={<section />} aria-labelledby={`${id}-question`}>
      <CardHeader className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <h2 id={`${id}-question`} className="text-base font-medium">
          {survey.question}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-me-1.5 -mt-1 shrink-0 text-muted-foreground"
          aria-label={t("surveys.card.dismiss")}
          onClick={onDismiss}
        >
          <IconXmarkOutline18 aria-hidden="true" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
        {done ? (
          <p role="status">{t("surveys.card.thanks")}</p>
        ) : (
          <PortalForm
            schema={schema}
            defaultValues={{ answer: "", comment: "" }}
            submitKey="surveys.card.submit"
            className={cn("gap-4 py-0", !picked && "[&>button]:hidden")}
            onSubmit={({ answer, comment }) =>
              onSubmit({
                ...(scale && { score: Number(answer) }),
                ...(!scale && !open && { choice: answer }),
                ...(comment && { comment }),
              })
            }
          >
            {(form) => {
              const problem =
                form.formState.errors.answer?.message ??
                form.formState.errors.comment?.message;
              return (
                <>
                  {open ? null : (
                    <div
                      role="radiogroup"
                      aria-labelledby={`${id}-question`}
                      // A scale keeps one row of equal cells, also at phone width.
                      className={
                        scale
                          ? "grid auto-cols-fr grid-flow-col gap-1"
                          : "flex flex-wrap gap-2"
                      }
                    >
                      {answers.map((value) => (
                        <label
                          key={value}
                          className={cn(option, !scale && "px-3")}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            value={value}
                            {...form.register("answer", {
                              onChange: () => setPicked(true),
                            })}
                          />
                          {value}
                        </label>
                      ))}
                    </div>
                  )}
                  <Field className={picked ? undefined : "hidden"}>
                    <FieldLabel htmlFor={`${id}-comment`}>
                      {t(
                        open
                          ? "surveys.card.openAnswer"
                          : "surveys.card.comment",
                      )}
                    </FieldLabel>
                    <Textarea
                      id={`${id}-comment`}
                      rows={2}
                      maxLength={2000}
                      {...form.register("comment")}
                    />
                  </Field>
                  {problem ? (
                    <p
                      role="alert"
                      className="text-xs text-destructive-foreground"
                    >
                      {String(problem)}
                    </p>
                  ) : null}
                </>
              );
            }}
          </PortalForm>
        )}
      </CardContent>
    </Card>
  );
}
