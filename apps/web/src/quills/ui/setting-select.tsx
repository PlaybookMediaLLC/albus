import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem, PortalProblemKind } from "../core/types";
import { PortalSelectContent } from "./portal-select-content";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  toast,
} from "./upstream";

export interface SettingSelectProps<V extends string> {
  /** The accessible name of the select. */
  label: string;
  value: V;
  options: readonly { value: V; label: string }[];
  disabled?: boolean;
  className?: string;
  /**
   * Saves the new value. Resolve after `value` shows it: the generated mutation hooks wait
   * for their refetch. A rejected promise moves the select back and shows a toast.
   */
  onValueChange: (next: V) => Promise<void>;
}

const problems: Partial<Record<PortalProblemKind, string>> = {
  noAccess: "settings.saveDenied",
  conflict: "core.problem.conflict",
  rateLimited: "core.problem.rateLimited",
};

/** A compact select that saves on change (settings spec 1.5), like `SettingSwitchRow`. */
export function SettingSelect<V extends string>({
  label,
  value,
  options,
  disabled,
  className,
  onValueChange,
}: SettingSelectProps<V>) {
  const { t } = useTranslation("quills");
  // The value that is being saved. The select shows it at once.
  const [saving, setSaving] = useState<V | null>(null);
  const change = async (next: V) => {
    if (next === value) return;
    setSaving(next);
    try {
      await onValueChange(next);
    } catch (error) {
      const kind = (error as Partial<PortalProblem> | null)?.kind;
      toast.error(t((kind && problems[kind]) || "core.problem.failed"));
    } finally {
      setSaving(null);
    }
  };
  return (
    <Select
      items={options}
      value={saving ?? value}
      disabled={disabled || saving !== null}
      onValueChange={(next) => {
        if (next) void change(next as V);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn("w-auto min-w-28", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <PortalSelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </PortalSelectContent>
    </Select>
  );
}
