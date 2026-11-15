import { Languages, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDisableHelpCenterLocale } from "../../hooks/team/use-disable-help-center-locale";
import { useGetHelpCenterSettings } from "../../hooks/team/use-get-help-center-settings";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import {
  Button,
  SettingsCard,
  SettingsEmpty,
  SettingsNote,
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "../../ui/upstream";
import {
  helpCenterLocales,
  isHelpCenterLocale,
  languageName,
  type HelpCenterLocale,
} from "./locales";
import { LanguageDialog } from "./parts/language-dialog";
import { LanguageRow } from "./parts/language-row";

export interface SettingsLanguagesPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * Settings › Languages (settings spec B3): the languages of the help center. The portal and
 * the widget use the language that each visitor picks, so no workspace setting exists for them.
 */
export function SettingsLanguagesPage({
  workspaceId,
}: SettingsLanguagesPageProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const settings = useGetHelpCenterSettings({ param }, team.viewer);
  const disable = useDisableHelpCenterLocale(team.viewer);
  const [editing, setEditing] = useState<HelpCenterLocale | "new" | null>(null);
  const manage = team.permissions.manageSettings;
  const locales = settings.data?.locales;
  const enabled: readonly string[] = locales
    ? [locales.default, ...locales.additional]
    : [];
  const available = helpCenterLocales.filter((code) => !enabled.includes(code));
  const name = (code: string) => languageName(code, i18n.language);
  return (
    <PageFrame
      titleKey="settings-workspace.languages.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage title={t("settings-workspace.languages.title")}>
        <SettingsSection
          title={t("settings-workspace.languages.title")}
          action={
            manage ? (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                disabled={!locales || !available.length}
                onClick={() => setEditing("new")}
              >
                <Plus aria-hidden="true" />
                {t("settings-workspace.languages.add")}
              </Button>
            ) : null
          }
        >
          <TeamStateView loading={settings.isPending} problem={settings.error}>
            {locales ? (
              <>
                <SettingsCard>
                  <SettingsRow
                    title={t("settings-workspace.languages.default")}
                    description={t("settings-workspace.languages.defaultText")}
                  >
                    <span className="text-sm">{name(locales.default)}</span>
                  </SettingsRow>
                  {locales.additional.length ? (
                    locales.additional.map((code) => (
                      <LanguageRow
                        key={code}
                        locale={code}
                        name={name(code)}
                        disabled={!manage || !isHelpCenterLocale(code)}
                        onEdit={() => {
                          if (isHelpCenterLocale(code)) setEditing(code);
                        }}
                        onRemove={() =>
                          isHelpCenterLocale(code)
                            ? disable.mutateAsync({
                                param,
                                query: { locale: code },
                              })
                            : Promise.resolve()
                        }
                      />
                    ))
                  ) : (
                    <SettingsEmpty
                      icon={<Languages />}
                      title={t("settings-workspace.languages.empty")}
                      description={t("settings-workspace.languages.emptyText")}
                    />
                  )}
                </SettingsCard>
                <SettingsNote>
                  {t("settings-workspace.languages.note")}
                </SettingsNote>
              </>
            ) : null}
          </TeamStateView>
        </SettingsSection>
        <LanguageDialog
          workspaceId={workspaceId}
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          locale={editing === "new" ? null : editing}
          chrome={locales?.chrome.find((item) => item.locale === editing)}
          available={available}
        />
      </SettingsPage>
    </PageFrame>
  );
}
