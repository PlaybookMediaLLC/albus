import { useTranslation } from "react-i18next";
import type { GetEmailChannelConfigResponse } from "../../../api/team/get-email-channel-config";
import { problemOf } from "../../../core/problem-of";
import { useClearInboundForwarding } from "../../../hooks/team/use-clear-inbound-forwarding";
import { useSetInboundForwarding } from "../../../hooks/team/use-set-inbound-forwarding";
import { useSetInboundTrust } from "../../../hooks/team/use-set-inbound-trust";
import { useTeamRuntime } from "../../../team/runtime";
import { CopyField } from "../../../ui/copy-field";
import { SettingSelect } from "../../../ui/setting-select";
import {
  Button,
  SettingsCard,
  SettingsRow,
  SettingsSection,
  toast,
} from "../../../ui/upstream";
import { ForwardingForm } from "./forwarding-form";

export interface InboundSectionProps {
  workspaceId: string;
  route: GetEmailChannelConfigResponse["inboundRoute"];
}

/** Inbound email: the inbox address, forwarding and the sender check. */
export function InboundSection({ workspaceId, route }: InboundSectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const forward = useSetInboundForwarding(team.viewer);
  const clear = useClearInboundForwarding(team.viewer);
  const trust = useSetInboundTrust(team.viewer);
  const param = { workspaceId };
  const manage = team.permissions.manageSettings;
  return (
    <SettingsSection title={t("settings-conversations.email.inbound")}>
      <SettingsCard>
        <SettingsRow
          title={t("settings-conversations.email.inbox")}
          description={t("settings-conversations.email.inboxText")}
        >
          {route?.address ? (
            <CopyField
              label={t("settings-conversations.email.inbox")}
              value={route.address}
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("settings-conversations.email.none")}
            </span>
          )}
        </SettingsRow>
        <SettingsRow
          title={t("settings-conversations.email.trust")}
          description={t("settings-conversations.email.trustText")}
        >
          <SettingSelect
            label={t("settings-conversations.email.trust")}
            value={route?.inboundTrust ?? "strict"}
            options={[
              {
                value: "strict",
                label: t("settings-conversations.email.strict"),
              },
              {
                value: "lenient",
                label: t("settings-conversations.email.lenient"),
              },
            ]}
            disabled={!manage}
            onValueChange={async (inboundTrust) => {
              await trust.mutateAsync({ param, json: { inboundTrust } });
            }}
          />
        </SettingsRow>
        {manage ? (
          <ForwardingForm
            key={route?.forwardingTarget ?? ""}
            target={route?.forwardingTarget ?? null}
            onSubmit={(forwardingTarget) =>
              problemOf(
                forward.mutateAsync({ param, json: { forwardingTarget } }),
              )
            }
          />
        ) : null}
        {manage && route?.forwardingTarget ? (
          <SettingsRow
            title={t("settings-conversations.email.stop")}
            description={t("settings-conversations.email.stopText")}
          >
            <Button
              variant="outline"
              size="sm"
              loading={clear.isPending}
              onClick={() =>
                clear.mutate(
                  { param },
                  {
                    onError: () =>
                      toast.error(t("settings-conversations.email.failed")),
                  },
                )
              }
            >
              {t("settings-conversations.email.stopAction")}
            </Button>
          </SettingsRow>
        ) : null}
      </SettingsCard>
    </SettingsSection>
  );
}
