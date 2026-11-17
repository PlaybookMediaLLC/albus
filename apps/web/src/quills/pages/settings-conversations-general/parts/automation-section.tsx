import { useTranslation } from "react-i18next";
import { problemOf } from "../../../core/problem-of";
import { useSetAwayReply } from "../../../hooks/team/use-set-away-reply";
import { useSetConversationRouting } from "../../../hooks/team/use-set-conversation-routing";
import { useSetEmailAutoAck } from "../../../hooks/team/use-set-email-auto-ack";
import { useSetWorkflowAbandonedAutoClose } from "../../../hooks/team/use-set-workflow-abandoned-auto-close";
import { useSetWorkflowCloseSpam } from "../../../hooks/team/use-set-workflow-close-spam";
import { useTeamRuntime } from "../../../team/runtime";
import { SettingSelect } from "../../../ui/setting-select";
import { SettingSwitchRow } from "../../../ui/setting-switch-row";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "../../../ui/upstream";
import { AwayReplyForm } from "./away-reply-form";

export interface AutomationSectionProps {
  workspaceId: string;
  routing: boolean;
  autoAck: boolean;
  awayReply: { enabled: boolean; message: string };
  abandoned: { enabled: boolean; waitMinutes: number };
  closeSpam: boolean;
}

const waits = [5, 10, 15, 30, 60];

/** Routing and the automatic replies and closes of conversations. */
export function AutomationSection({
  workspaceId,
  routing,
  autoAck,
  awayReply,
  abandoned,
  closeSpam,
}: AutomationSectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const setRouting = useSetConversationRouting(team.viewer);
  const setAutoAck = useSetEmailAutoAck(team.viewer);
  const setAway = useSetAwayReply(team.viewer);
  const setAbandoned = useSetWorkflowAbandonedAutoClose(team.viewer);
  const setCloseSpam = useSetWorkflowCloseSpam(team.viewer);
  const param = { workspaceId };
  const locked = !team.permissions.manageSettings;
  const minutes = waits.includes(abandoned.waitMinutes)
    ? waits
    : [...waits, abandoned.waitMinutes].sort((a, b) => a - b);
  return (
    <SettingsSection title={t("settings-conversations.general.automation")}>
      <SettingsCard>
        <SettingSwitchRow
          title={t("settings-conversations.general.routing")}
          description={t("settings-conversations.general.routingText")}
          checked={routing}
          disabled={locked}
          onCheckedChange={async (enabled) => {
            await setRouting.mutateAsync({
              param,
              json: { enabled, strategy: "auto_assign_active" },
            });
          }}
        />
        <SettingSwitchRow
          title={t("settings-conversations.general.autoAck")}
          description={t("settings-conversations.general.autoAckText")}
          checked={autoAck}
          disabled={locked}
          onCheckedChange={async (enabled) => {
            await setAutoAck.mutateAsync({ param, json: { enabled } });
          }}
        />
        <SettingSwitchRow
          title={t("settings-conversations.general.awayReply")}
          description={t("settings-conversations.general.awayReplyText")}
          checked={awayReply.enabled}
          disabled={locked}
          onCheckedChange={async (enabled) => {
            await setAway.mutateAsync({
              param,
              json: { ...awayReply, enabled },
            });
          }}
        />
        {awayReply.enabled && !locked ? (
          <AwayReplyForm
            values={{ message: awayReply.message }}
            onSubmit={(values) =>
              problemOf(
                setAway.mutateAsync({
                  param,
                  json: { enabled: true, message: values.message },
                }),
              )
            }
          />
        ) : null}
        <SettingSwitchRow
          title={t("settings-conversations.general.abandoned")}
          description={t("settings-conversations.general.abandonedText")}
          checked={abandoned.enabled}
          disabled={locked}
          onCheckedChange={async (enabled) => {
            await setAbandoned.mutateAsync({ param, json: { enabled } });
          }}
        />
        {abandoned.enabled ? (
          <SettingsRow
            title={t("settings-conversations.general.wait")}
            description={t("settings-conversations.general.waitText")}
          >
            <SettingSelect
              label={t("settings-conversations.general.wait")}
              value={String(abandoned.waitMinutes)}
              options={minutes.map((value) => ({
                value: String(value),
                label: t("settings-conversations.general.minutes", {
                  count: value,
                }),
              }))}
              disabled={locked}
              onValueChange={async (next) => {
                await setAbandoned.mutateAsync({
                  param,
                  json: { waitMinutes: Number(next) },
                });
              }}
            />
          </SettingsRow>
        ) : null}
        <SettingSwitchRow
          title={t("settings-conversations.general.closeSpam")}
          description={t("settings-conversations.general.closeSpamText")}
          checked={closeSpam}
          disabled={locked}
          onCheckedChange={async (enabled) => {
            await setCloseSpam.mutateAsync({ param, json: { enabled } });
          }}
        />
      </SettingsCard>
    </SettingsSection>
  );
}
