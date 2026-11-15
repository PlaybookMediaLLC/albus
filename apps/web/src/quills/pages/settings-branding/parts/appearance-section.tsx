import { useTranslation } from "react-i18next";
import type { GetBrandingSettingsResponse } from "../../../api/team/get-branding-settings";
import { SettingsCard, SettingsSection } from "../../../ui/upstream";
import { brandColors, colorOf, withColor } from "../brand-colors";
import { SelectRow } from "./select-row";

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
  return (
    <SettingsSection title={t("settings-workspace.branding.appearance")}>
      <SettingsCard>
        <SelectRow
          title={t("settings-workspace.branding.primaryColor")}
          description={t("settings-workspace.branding.primaryColorText")}
          value={colorOf(theme)}
          placeholder={t("settings-workspace.branding.customColor")}
          options={brandColors.map((color) => ({
            value: color.id,
            label: t(color.labelKey),
            dot: color.dot,
          }))}
          disabled={disabled}
          onValueChange={(id) => onSave(withColor(theme, id))}
        />
        <SelectRow
          title={t("settings-workspace.branding.theme")}
          description={t("settings-workspace.branding.themeText")}
          value={theme.themeMode ?? "user"}
          options={modes.map(([value, key]) => ({ value, label: t(key) }))}
          disabled={disabled}
          onValueChange={(mode) =>
            onSave({
              ...theme,
              themeMode: mode === "light" || mode === "dark" ? mode : "user",
            })
          }
        />
      </SettingsCard>
    </SettingsSection>
  );
}
