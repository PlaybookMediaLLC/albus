import { useTranslation } from "react-i18next";
import type { UpdateAssistantSettingsRequest } from "../../api/team/update-assistant-settings";
import { problemOf } from "../../core/problem-of";
import type { PortalProblem } from "../../core/types";
import { useGetAssistantSettings } from "../../hooks/team/use-get-assistant-settings";
import { useUpdateAssistantSettings } from "../../hooks/team/use-update-assistant-settings";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { SettingSwitchRow } from "../../ui/setting-switch-row";
import {
  Alert,
  AlertDescription,
  SettingsCard,
  SettingsPage,
  SettingsSection,
} from "../../ui/upstream";
import { VoiceForm } from "./parts/voice-form";

export interface SettingsConversationsAiPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

type Patch = Omit<UpdateAssistantSettingsRequest["json"], "revision">;
type Source = "helpCenter" | "posts" | "changelog" | "documents" | "status";
const sources: readonly [Source, string][] = [
  ["helpCenter", "settings-conversations.ai.sources.helpCenter"],
  ["posts", "settings-conversations.ai.sources.posts"],
  ["changelog", "settings-conversations.ai.sources.changelog"],
  ["documents", "settings-conversations.ai.sources.documents"],
  ["status", "settings-conversations.ai.sources.status"],
];

/** Settings › AI (settings spec B12): the assistant voice, its knowledge and the copilot. */
export function SettingsConversationsAiPage({
  workspaceId,
}: SettingsConversationsAiPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const settings = useGetAssistantSettings({ param }, team.viewer);
  const update = useUpdateAssistantSettings(team.viewer);
  const data = settings.data;
  const locked = !team.permissions.manageSettings;
  // The API refuses a write that does not name the revision it read. On a conflict another
  // person saved first: reload their values, then show the problem. The voice form keeps
  // the unsaved text of the user, and its next save sends the new revision.
  const save = async (patch: Patch) => {
    try {
      await update.mutateAsync({
        param,
        json: { revision: data?.revision ?? 1, ...patch },
      });
    } catch (problem) {
      if ((problem as PortalProblem).kind === "conflict")
        await settings.refetch();
      throw problem;
    }
  };
  return (
    <PageFrame
      titleKey="settings-conversations.ai.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-conversations.ai.title")}
        description={t("settings-conversations.ai.description")}
      >
        <TeamStateView loading={settings.isPending} problem={settings.error}>
          {data && !data.aiConfigured ? (
            <Alert>
              <AlertDescription className="text-foreground">
                {t("settings-conversations.ai.notConfigured")}
              </AlertDescription>
            </Alert>
          ) : null}
          {data ? (
            <>
              <SettingsSection
                title={t("settings-conversations.ai.assistant")}
                description={t("settings-conversations.ai.assistantText")}
              >
                <SettingsCard>
                  <SettingSwitchRow
                    title={t("settings-conversations.ai.answerCustomers")}
                    description={t(
                      "settings-conversations.ai.answerCustomersText",
                    )}
                    checked={data.agent.enabled}
                    disabled={locked || !data.aiConfigured}
                    onCheckedChange={(agentEnabled) => save({ agentEnabled })}
                  />
                </SettingsCard>
                <SettingsCard>
                  <VoiceForm
                    values={{
                      name: data.identity.name,
                      productDescription: data.agent.productDescription,
                      ...data.agent.voice,
                    }}
                    onSubmit={({ name, productDescription, ...agentVoice }) =>
                      problemOf(
                        save({
                          name,
                          agentVoice,
                          agentProductDescription: productDescription,
                        }),
                      )
                    }
                  />
                </SettingsCard>
              </SettingsSection>
              <SettingsSection
                title={t("settings-conversations.ai.knowledge")}
                description={t("settings-conversations.ai.knowledgeText")}
              >
                <SettingsCard>
                  {sources.map(([source, key]) => (
                    <SettingSwitchRow
                      key={source}
                      title={t(key)}
                      checked={data.agent.knowledge[source]}
                      disabled={locked}
                      onCheckedChange={(next) =>
                        save({
                          agentKnowledge: {
                            ...data.agent.knowledge,
                            [source]: next,
                          },
                        })
                      }
                    />
                  ))}
                </SettingsCard>
              </SettingsSection>
              <SettingsSection title={t("settings-conversations.ai.copilot")}>
                <SettingsCard>
                  <SettingSwitchRow
                    title={t("settings-conversations.ai.qa")}
                    description={t("settings-conversations.ai.qaText")}
                    checked={data.copilot.qa}
                    disabled={locked}
                    onCheckedChange={(copilotQa) => save({ copilotQa })}
                  />
                </SettingsCard>
              </SettingsSection>
            </>
          ) : null}
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
