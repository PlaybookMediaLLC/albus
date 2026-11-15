import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { PortalSelectContent } from "../../../ui/portal-select-content";
import {
  cn,
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsRow,
  toast,
} from "../../../ui/upstream";

type Option = { value: string; label: string; dot?: string };

export interface SelectRowProps {
  title: string;
  description?: string;
  value: string | null;
  options: readonly Option[];
  /** Shows when the stored value is not one of the options. */
  placeholder?: string;
  disabled?: boolean;
  /** Saves the new value. A rejected promise moves the select back and shows a toast. */
  onValueChange: (next: string) => Promise<void>;
}

const label = (option: Option) => (
  <span className="flex items-center gap-2">
    {option.dot ? (
      <span
        aria-hidden="true"
        className={cn("size-2.5 shrink-0 rounded-full", option.dot)}
      />
    ) : null}
    {option.label}
  </span>
);

/** A settings row with a select that saves on change (settings spec 1.5). */
export function SelectRow(props: SelectRowProps) {
  const { t } = useTranslation("quills");
  // The value that is being saved. The select shows it at once.
  const [saving, setSaving] = useState<string | null>(null);
  const value = saving ?? props.value;
  const change = async (next: string) => {
    setSaving(next);
    try {
      await props.onValueChange(next);
    } catch (error) {
      const denied = (error as PortalProblem | null)?.kind === "noAccess";
      toast.error(t(denied ? "settings.saveDenied" : "core.problem.failed"));
    } finally {
      setSaving(null);
    }
  };
  return (
    <SettingsRow title={props.title} description={props.description}>
      <Select
        items={props.options}
        value={value}
        disabled={props.disabled || saving !== null}
        onValueChange={(next) => {
          if (next && next !== value) void change(next);
        }}
      >
        <SelectTrigger
          size="sm"
          className="w-auto min-w-32"
          aria-label={props.title}
        >
          <SelectValue>
            {(current: string | null) => {
              const option = props.options.find(
                (item) => item.value === current,
              );
              return option ? label(option) : props.placeholder;
            }}
          </SelectValue>
        </SelectTrigger>
        <PortalSelectContent>
          <SelectGroup>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {label(option)}
              </SelectItem>
            ))}
          </SelectGroup>
        </PortalSelectContent>
      </Select>
    </SettingsRow>
  );
}
