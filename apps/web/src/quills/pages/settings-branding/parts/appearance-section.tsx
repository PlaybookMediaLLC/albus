import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetBrandingSettingsResponse } from "../../../api/team/get-branding-settings";
import { SettingSelect } from "../../../ui/setting-select";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "../../../ui/upstream";
import { brandColors, colorOf, withColor } from "../brand-colors";

type Theme = GetBrandingSettingsResponse["theme"];

export interface AppearanceSectionProps {
  theme: Theme;
  disabled?: boolean;
  /** Saves the whole theme: the API replaces it on a write. */
  onSave: (theme: Theme) => Promise<void>;
}

const modes = [
  ["user", "settings-workspace.branding.modes.user"],
  ["light", "settings-workspace.branding.modes.light"],
  ["dark", "settings-workspace.branding.modes.dark"],
] as const;

/** The primary color and the light or dark mode of the portal. */
export function AppearanceSection({
  theme,
  disabled,
  onSave,
}: AppearanceSectionProps) {
  const { t } = useTranslation("quills");
  const colorTitle = t("settings-workspace.branding.primaryColor");
  const themeTitle = t("settings-workspace.branding.theme");
  // Each save sends the whole theme. The other select waits for it, so that a second
  // change starts from the saved theme and does not undo the first change.
  const [saving, setSaving] = useState(false);
  const save = async (next: Theme) => {
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  };
  return (
    <SettingsSection title={t("settings-workspace.branding.appearance")}>
      <SettingsCard>
        <SettingsRow
          title={colorTitle}
          description={t("settings-workspace.branding.primaryColorText")}
        >
          <SettingSelect
            label={colorTitle}
            value={colorOf(theme)}
            placeholder={t("settings-workspace.branding.customColor")}
            options={brandColors.map((color) => ({
              value: color.id,
              label: t(color.labelKey),
              dot: color.dot,
            }))}
            disabled={disabled || saving}
            onValueChange={(id) => save(withColor(theme, id))}
          />
        </SettingsRow>
        <SettingsRow
          title={themeTitle}
          description={t("settings-workspace.branding.themeText")}
        >
          <SettingSelect
            label={themeTitle}
            value={theme.themeMode ?? "user"}
            options={modes.map(([value, key]) => ({ value, label: t(key) }))}
            disabled={disabled || saving}
            onValueChange={(themeMode) => save({ ...theme, themeMode })}
          />
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>
  );
}
