import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from "react-hook-form";
import { PortalSelectContent } from "../../ui/portal-select-content";
import {
  Field,
  FieldError,
  FieldLabel,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/upstream";

export interface PillSelectProps<
  T extends FieldValues,
  N extends FieldPath<T>,
> {
  control: Control<T>;
  name: N;
  /** The hidden label. The trigger gets its accessible name from it. */
  label: string;
  /** An option can have an icon, such as a status icon. */
  options: readonly {
    value: PathValue<T, N>;
    label: string;
    icon?: ReactNode;
  }[];
}

/**
 * A compact rounded Select that edits one react-hook-form field, as in the New request dialog.
 * Without a value, the trigger shows the label. The error shows next to the trigger.
 */
export function PillSelect<T extends FieldValues, N extends FieldPath<T>>(
  props: PillSelectProps<T, N>,
) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => {
        const current = props.options.find(
          (option) => option.value === field.value,
        );
        return (
          <Field
            invalid={Boolean(fieldState.error)}
            className="flex-row flex-wrap items-center"
          >
            <FieldLabel className="sr-only">{props.label}</FieldLabel>
            <Select
              items={props.options}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                ref={field.ref}
                size="sm"
                onBlur={field.onBlur}
                className="w-auto min-w-0 rounded-full before:rounded-full"
              >
                <SelectValue className="flex items-center gap-1.5">
                  {() =>
                    current ? (
                      <>
                        {current.icon}
                        {current.label}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {props.label}
                      </span>
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <PortalSelectContent alignItemWithTrigger={false}>
                {props.options.map((option) => (
                  <SelectItem key={String(option.value)} value={option.value}>
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </PortalSelectContent>
            </Select>
            {fieldState.error?.message ? (
              <FieldError match role="alert">
                {fieldState.error.message}
              </FieldError>
            ) : null}
          </Field>
        );
      }}
    />
  );
}
