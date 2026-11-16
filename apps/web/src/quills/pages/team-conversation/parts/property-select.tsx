import type { ReactNode } from "react";
import { PortalSelectContent } from "../../../ui/portal-select-content";
import {
  cn,
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/upstream";

export interface PropertySelectProps {
  /** The accessible name, such as "Status". */
  label: string;
  value: string;
  options: readonly { value: string; label: string; icon?: ReactNode }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** A borderless trigger for a panel row; its border shows on hover and focus. */
  ghost?: boolean;
}

/** A compact picker for one conversation property, such as the status or the assignee. */
export function PropertySelect(props: PropertySelectProps) {
  const selected = props.options.find((option) => option.value === props.value);
  const content = (option: (typeof props.options)[number]) => (
    <span className="flex min-w-0 items-center gap-2">
      {option.icon}
      <span className="truncate">{option.label}</span>
    </span>
  );
  return (
    <Select
      items={[...props.options]}
      value={props.value}
      disabled={props.disabled}
      onValueChange={(value) => {
        if (value !== null && value !== props.value) props.onChange(value);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={props.label}
        className={cn(
          "w-auto min-w-28 max-w-56",
          // The same variants as the trigger's inner edge, so the merge drops that edge too.
          props.ghost &&
            "-ms-2 border-transparent bg-transparent shadow-none not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-none dark:not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent [&_svg:last-child]:opacity-0 hover:[&_svg:last-child]:opacity-80 focus-visible:[&_svg:last-child]:opacity-80 pointer-coarse:[&_svg:last-child]:opacity-80",
        )}
      >
        <SelectValue>{selected ? content(selected) : null}</SelectValue>
      </SelectTrigger>
      <PortalSelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {content(option)}
            </SelectItem>
          ))}
        </SelectGroup>
      </PortalSelectContent>
    </Select>
  );
}
