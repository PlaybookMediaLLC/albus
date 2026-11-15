import { brandText } from "@kaneo/branding";
import { useTranslation } from "react-i18next";
import { useGetPortalSettings } from "../../hooks/team/use-get-portal-settings";
import { useGetWidgetSecret } from "../../hooks/team/use-get-widget-secret";
import { useUpdatePortalSettings } from "../../hooks/team/use-update-portal-settings";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { CopyField } from "../../ui/copy-field";
import { PageFrame } from "../../ui/page-frame";
import { SettingSwitchRow } from "../../ui/setting-switch-row";
import {
  SettingsCard,
  SettingsNote,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  StatusBadge,
  useGetConfig,
} from "../../ui/upstream";
import { WidgetSecretRows } from "./parts/widget-secret-rows";
import { signInMethods } from "./sign-in-methods";

export interface SettingsLoginPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/** Settings › Login (settings spec B8): portal sign-in, the workspace ID and the widget secret. */
export function SettingsLoginPage({ workspaceId }: SettingsLoginPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const config = useGetConfig();
  const portal = useGetPortalSettings({ param }, team.viewer);
  const secret = useGetWidgetSecret({ param }, team.viewer);
  const update = useUpdatePortalSettings(team.viewer);
  const methods = config.data ? signInMethods(config.data) : [];
  return (
    <PageFrame
      titleKey="settings-product.login.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage title={t("settings-product.login.title")}>
        <TeamStateView
          loading={portal.isPending || secret.isPending}
          problem={portal.error ?? secret.error}
        >
          <SettingsSection title={t("settings-product.login.authentication")}>
            <SettingsCard>
              <SettingsRow
                title={t("settings-product.login.methodsTitle")}
                description={t("settings-product.login.methodsText")}
              >
                <span className="text-sm text-muted-foreground">
                  {methods.length
                    ? methods.map((method) => t(method)).join(", ")
                    : t("settings-product.login.methods.none")}
                </span>
              </SettingsRow>
              <SettingSwitchRow
                title={t("settings-product.login.signup")}
                description={t("settings-product.login.signupText")}
                checked={portal.data?.openSignup ?? false}
                disabled={!team.permissions.manageSettings}
                onCheckedChange={async (openSignup) => {
                  await update.mutateAsync({ param, json: { openSignup } });
                }}
              />
              <SettingsRow
                title={t("settings-product.login.tokens")}
                description={t("settings-product.login.tokensText")}
              >
                <StatusBadge tone="success">
                  {t("settings-product.login.required")}
                </StatusBadge>
              </SettingsRow>
            </SettingsCard>
            <SettingsNote>
              {t("settings-product.login.docsNote")}{" "}
              <a
                href={brandText("https://kaneo.app/docs")}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {t("settings-product.login.docs")}
              </a>
            </SettingsNote>
          </SettingsSection>
          <SettingsSection title={t("settings-product.login.secrets")}>
            <SettingsCard>
              <SettingsRow
                title={t("settings-product.login.workspaceId")}
                description={t("settings-product.login.workspaceIdText")}
              >
                <CopyField
                  label={t("settings-product.login.workspaceId")}
                  value={workspaceId}
                />
              </SettingsRow>
              <WidgetSecretRows
                workspaceId={workspaceId}
                secret={secret.data?.secret ?? null}
              />
            </SettingsCard>
          </SettingsSection>
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
