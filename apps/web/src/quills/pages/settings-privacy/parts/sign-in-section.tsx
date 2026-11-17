import { useTranslation } from "react-i18next";
import type { UpdatePortalSignInRequest } from "../../../api/team/update-portal-sign-in";
import { problemOf } from "../../../core/problem-of";
import { useUpdatePortalSignIn } from "../../../hooks/team/use-update-portal-sign-in";
import { useTeamRuntime } from "../../../team/runtime";
import { SettingSelect } from "../../../ui/setting-select";
import { SettingSwitchRow } from "../../../ui/setting-switch-row";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "../../../ui/upstream";
import { SsoUrlForm } from "./sso-url-form";

type Policy = UpdatePortalSignInRequest["json"];

/**
 * How customers sign in to the portal (gaps G-17 and G-24). They always sign in with a Kaneo
 * account; this chooses the sign-in button and whether the widget opens the portal signed in.
 */
export interface SignInSectionProps {
  workspaceId: string;
  locked: boolean;
  /** The stored policy, from the portal settings. */
  data: Policy;
}

export function SignInSection({
  workspaceId,
  locked,
  data,
}: SignInSectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const update = useUpdatePortalSignIn(team.viewer);
  const save = (patch: Partial<Policy>) =>
    update.mutateAsync({
      param: { workspaceId },
      json: { ...data, ...patch },
    });
  return (
    <SettingsSection
      title={t("settings-product.privacy.signIn")}
      description={t("settings-product.privacy.signInText")}
    >
      <SettingsCard>
        <SettingsRow title={t("settings-product.privacy.signInMode")}>
          <SettingSelect
            label={t("settings-product.privacy.signInMode")}
            value={data.mode}
            options={[
              {
                value: "kaneo",
                label: t("settings-product.privacy.signInModes.kaneo"),
              },
              ...(data.ssoUrl
                ? [
                    {
                      value: "sso" as const,
                      label: t("settings-product.privacy.signInModes.sso"),
                    },
                  ]
                : []),
              {
                value: "disabled",
                label: t("settings-product.privacy.signInModes.disabled"),
              },
            ]}
            disabled={locked}
            onValueChange={async (mode) => {
              await save({ mode });
            }}
          />
        </SettingsRow>
        {locked ? null : (
          <SsoUrlForm
            key={data.ssoUrl ?? ""}
            ssoUrl={data.ssoUrl}
            onSubmit={(ssoUrl) => problemOf(save({ ssoUrl }))}
          />
        )}
        <SettingSwitchRow
          title={t("settings-product.privacy.widgetSignIn")}
          description={t("settings-product.privacy.widgetSignInText")}
          checked={data.widgetSignIn}
          disabled={locked}
          onCheckedChange={async (widgetSignIn) => {
            await save({ widgetSignIn });
          }}
        />
      </SettingsCard>
    </SettingsSection>
  );
}
