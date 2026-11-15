import { PenLine, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RowActionsMenu, SettingsRow, toast } from "../../../ui/upstream";

export interface LanguageRowProps {
  locale: string;
  name: string;
  disabled?: boolean;
  onEdit: () => void;
  /** Turns the language off. The API keeps its translations for a later re-enable. */
  onRemove: () => Promise<unknown>;
}

/** One additional help-center language: its name, its code and its actions. */
export function LanguageRow({
  locale,
  name,
  disabled,
  onEdit,
  onRemove,
}: LanguageRowProps) {
  const { t } = useTranslation("quills");
  return (
    <SettingsRow
      title={name}
      badge={
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          {locale}
        </code>
      }
    >
      {disabled ? null : (
        <RowActionsMenu
          label={t("settings-workspace.languages.actions", { language: name })}
          actions={[
            {
              id: "edit",
              label: t("settings-workspace.languages.edit"),
              icon: PenLine,
              onSelect: onEdit,
            },
            {
              id: "remove",
              label: t("settings-workspace.languages.remove"),
              icon: Trash2,
              destructive: true,
              onSelect: () =>
                void onRemove().catch(() =>
                  toast.error(t("core.problem.failed")),
                ),
            },
          ]}
        />
      )}
    </SettingsRow>
  );
}
