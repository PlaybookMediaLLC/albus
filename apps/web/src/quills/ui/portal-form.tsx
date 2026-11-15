import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState, type ReactNode } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import type { PortalProblem } from "../core/types";
import { isFramed } from "./confirm-action";
import { Button, Fieldset, cn } from "./upstream";
import { StateView } from "./state-view";

export interface PortalFormProps<T extends FieldValues> {
  schema: z.ZodType<T, T>;
  defaultValues: DefaultValues<T>;
  /**
   * The stored values, when they can change while the form is open (for example, another
   * person saves). The form takes them, but a field that the user changed keeps its value.
   */
  values?: T;
  submitKey: string;
  resetOnSuccess?: boolean;
  onSubmit: (values: T) => Promise<PortalProblem | void>;
  children: (form: UseFormReturn<T>) => ReactNode;
  className?: string;
  /** Controls in one row with the submit button, such as a compact select. */
  footer?: (form: UseFormReturn<T>) => ReactNode;
  /** An icon-only submit button; the submit label becomes its accessible name. */
  submitIcon?: ReactNode;
}

export function PortalForm<T extends FieldValues>(props: PortalFormProps<T>) {
  const { t } = useTranslation("quills");
  const form = useForm<T>({
    defaultValues: props.defaultValues,
    ...(props.values && {
      values: props.values,
      resetOptions: { keepDirtyValues: true },
    }),
    resolver: zodResolver(props.schema) as Resolver<T>,
  });
  const [problem, setProblem] = useState<PortalProblem | null>(null);
  // After a field problem or a conflict (the stored data changed), the user can submit
  // again. Other problems wait for "Try again" or a reload.
  const blocked = Boolean(
    problem && problem.kind !== "invalid" && problem.kind !== "conflict",
  );
  const running = useRef(false);
  const submit = form.handleSubmit(async (values) => {
    if (running.current || blocked) return;
    setProblem(null);
    if (isFramed()) {
      form.setError("root", { message: t("core.frameBlocked") });
      return;
    }
    running.current = true;
    try {
      const result = await props.onSubmit(values);
      if (result?.kind === "invalid" && result.issues?.length) {
        for (const issue of result.issues) {
          form.setError(issue.path as never, { message: issue.message });
        }
      } else {
        setProblem(result ?? null);
        if (!result && props.resetOnSuccess) form.reset();
      }
    } catch (error) {
      setProblem(
        error &&
          typeof error === "object" &&
          "kind" in error &&
          [
            "authRequired",
            "noAccess",
            "notFound",
            "gone",
            "conflict",
            "invalid",
            "rateLimited",
            "failed",
          ].includes(String(error.kind))
          ? (error as PortalProblem)
          : { kind: "failed" },
      );
    } finally {
      running.current = false;
    }
  });
  const submitButton = (
    <Button
      type="submit"
      size={props.submitIcon ? "icon-sm" : undefined}
      className={props.submitIcon ? "ml-auto rounded-full" : undefined}
      aria-label={props.submitIcon ? t(props.submitKey) : undefined}
      disabled={form.formState.isSubmitting || blocked}
      loading={form.formState.isSubmitting}
    >
      {props.submitIcon ?? t(props.submitKey)}
    </Button>
  );
  return (
    <form
      className={cn(
        "portal-form flex max-w-2xl flex-col gap-5 py-2",
        props.className,
      )}
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {form.formState.errors.root?.message ? (
        <p role="alert">{form.formState.errors.root.message}</p>
      ) : null}
      <Fieldset className="max-w-none">{props.children(form)}</Fieldset>
      <StateView problem={problem} onRetry={() => setProblem(null)}>
        {null}
      </StateView>
      {props.footer ? (
        <div className="flex items-center gap-2">
          {props.footer(form)}
          {submitButton}
        </div>
      ) : (
        submitButton
      )}
    </form>
  );
}
