import { Lock } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem, PortalProblemKind } from "../core/types";
import {
  Label,
  SettingsRow,
  Switch,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./upstream";

export interface SettingSwitchRowProps {
  title: string;
  description?: string;
  checked: boolean;
  /** For example, the switch of a teammate without manage_settings. */
  disabled?: boolean;
  /** Why a plan or the instance locks the switch, such as "Needs an active plan". */
  locked?: string;
  /**
   * Saves the new value. Resolve after `checked` shows it: the generated mutation hooks
   * wait for their refetch. A rejected promise moves the switch back and shows a toast.
   */
  onCheckedChange: (next: boolean) => Promise<void>;
}

const problems: Partial<Record<PortalProblemKind, string>> = {
  noAccess: "settings.saveDenied",
  conflict: "core.problem.conflict",
  rateLimited: "core.problem.rateLimited",
};

/** A settings row with a switch that saves on change (settings spec 1.5 and 1.7). */
export function SettingSwitchRow({
  title,
  description,
  checked,
  disabled,
  locked,
  onCheckedChange,
}: SettingSwitchRowProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  // The value that is being saved. The switch shows it at once.
  const [saving, setSaving] = useState<boolean | null>(null);
  const change = async (next: boolean) => {
    setSaving(next);
    try {
      await onCheckedChange(next);
    } catch (error) {
      const kind = (error as Partial<PortalProblem> | null)?.kind;
      toast.error(t((kind && problems[kind]) || "core.problem.failed"));
    } finally {
      setSaving(null);
    }
  };
  return (
    <SettingsRow
      title={<Label htmlFor={id}>{title}</Label>}
      description={description}
    >
      {locked ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                role="img"
                aria-label={locked}
                className="text-warning-foreground"
              />
            }
          >
            <Lock aria-hidden="true" className="size-4" />
          </TooltipTrigger>
          <TooltipContent>{locked}</TooltipContent>
        </Tooltip>
      ) : null}
      <Switch
        id={id}
        checked={saving ?? checked}
        disabled={disabled || Boolean(locked) || saving !== null}
        onCheckedChange={(next) => void change(next)}
      />
    </SettingsRow>
  );
}
