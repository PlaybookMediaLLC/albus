import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../core/types";
import { PortalForm } from "./portal-form";
import {
  Button,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "./upstream";

export interface NameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** The field label, such as "Name". */
  label: string;
  placeholder?: string;
  /** A fixed text before the field, such as "https://". */
  prefix?: string;
  maxLength: number;
  /** The current name when the dialog renames an item. */
  defaultValue?: string;
  /** The translation key of the submit button, such as "Create". */
  submitKey: string;
  /** The field error for a conflict, such as "A tag with this name exists". */
  taken?: string;
  /** The API issue path of the field when it is not "name", such as "domain". */
  issuePath?: string;
  /** Saves the trimmed name. Return a problem to keep the dialog open. */
  onSubmit: (name: string) => Promise<PortalProblem | void>;
}

/** A dialog with one name field that creates or renames an item (settings spec 1.4). */
export function NameDialog(props: NameDialogProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("settings-product.dialog.required"))
      .max(
        props.maxLength,
        t("settings-product.dialog.tooLong", { count: props.maxLength }),
      ),
  });
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <PortalForm
          schema={schema}
          defaultValues={{ name: props.defaultValue ?? "" }}
          submitKey={props.submitKey}
          // The last row holds Cancel and the submit button: the gray footer band of a dialog.
          className="max-w-none gap-4 py-0 *:not-last:px-6 *:last:justify-end *:last:rounded-b-2xl *:last:border-t *:last:bg-muted/72 *:last:px-6 *:last:py-4"
          footer={() => (
            <DialogClose render={<Button type="button" variant="ghost" />}>
              {t("settings-product.dialog.cancel")}
            </DialogClose>
          )}
          onSubmit={async ({ name }) => {
            const problem = await props.onSubmit(name);
            if (problem?.kind === "conflict" && props.taken)
              return {
                kind: "invalid",
                issues: [{ path: "name", message: props.taken }],
              };
            if (problem?.kind !== "invalid" || !props.issuePath) return problem;
            return {
              ...problem,
              issues: problem.issues?.map((issue) =>
                issue.path === props.issuePath
                  ? { ...issue, path: "name" }
                  : issue,
              ),
            };
          }}
        >
          {(form) => {
            const error = form.formState.errors.name?.message;
            const input = {
              id,
              autoComplete: "off",
              autoFocus: true,
              placeholder: props.placeholder,
              "aria-invalid": Boolean(error),
              ...form.register("name"),
            };
            return (
              <Field invalid={Boolean(error)}>
                <FieldLabel htmlFor={id}>{props.label}</FieldLabel>
                {props.prefix ? (
                  <InputGroup>
                    <InputGroupInput {...input} />
                    <InputGroupAddon align="inline-start">
                      <span className="font-mono text-xs text-muted-foreground">
                        {props.prefix}
                      </span>
                    </InputGroupAddon>
                  </InputGroup>
                ) : (
                  <Input {...input} />
                )}
                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {String(error)}
                  </p>
                ) : null}
              </Field>
            );
          }}
        </PortalForm>
      </DialogPopup>
    </Dialog>
  );
}
