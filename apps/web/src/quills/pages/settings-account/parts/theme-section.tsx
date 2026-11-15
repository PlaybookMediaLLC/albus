import { useTranslation } from "react-i18next";
import { PortalSelectContent } from "../../../ui/portal-select-content";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsCard,
  SettingsRow,
  SettingsSection,
  useUserPreferencesStore,
} from "../../../ui/upstream";

/** The section takes no props: the theme is a preference of this browser. */
export type ThemeSectionProps = Record<string, never>;

const themes = [
  ["system", "settings-workspace.account.themes.system"],
  ["light", "settings-workspace.account.themes.light"],
  ["dark", "settings-workspace.account.themes.dark"],
] as const;

/** The app theme of this browser: Kaneo's own preference, without an API. */
export function ThemeSection() {
  const { t } = useTranslation("quills");
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);
  const title = t("settings-workspace.account.theme");
  const items = themes.map(([value, key]) => ({ value, label: t(key) }));
  return (
    <SettingsSection title={t("settings-workspace.account.appearance")}>
      <SettingsCard>
        <SettingsRow
          title={title}
          description={t("settings-workspace.account.themeText")}
        >
          <Select
            items={items}
            value={theme}
            onValueChange={(next) => {
              if (next) setTheme(next);
            }}
          >
            <SelectTrigger size="sm" className="w-auto" aria-label={title}>
              <SelectValue />
            </SelectTrigger>
            <PortalSelectContent>
              <SelectGroup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </PortalSelectContent>
          </Select>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>
  );
}
