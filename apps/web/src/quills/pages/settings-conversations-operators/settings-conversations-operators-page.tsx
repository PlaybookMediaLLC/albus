import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useListPrincipals } from "../../hooks/team/use-list-principals";
import { useListTeams } from "../../hooks/team/use-list-teams";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { PersonAvatar } from "../../ui/person-avatar";
import {
  SettingsCard,
  SettingsEmpty,
  SettingsNote,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  StatusBadge,
} from "../../ui/upstream";
import { AvailabilityRow } from "./parts/availability-row";
import { SupportTeamRow } from "./parts/support-team-row";

export interface SettingsConversationsOperatorsPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/** Settings › Operators (settings spec B12): availability, teammates and support teams. */
export function SettingsConversationsOperatorsPage({
  workspaceId,
}: SettingsConversationsOperatorsPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  // ponytail: the first 100 teammates (the API maximum); page them when a workspace has more.
  const people = useListPrincipals(
    { param, query: { limit: "100" } },
    team.viewer,
  );
  const teams = useListTeams({ param }, team.viewer);
  const roster = teams.data?.members ?? [];
  return (
    <PageFrame
      titleKey="settings-conversations.operators.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage title={t("settings-conversations.operators.title")}>
        <SettingsCard>
          <AvailabilityRow workspaceId={workspaceId} />
        </SettingsCard>
        <TeamStateView
          loading={people.isPending || teams.isPending}
          problem={people.error ?? teams.error}
        >
          <SettingsSection title={t("settings-conversations.operators.people")}>
            <SettingsCard>
              {people.data?.items.map((person) => (
                <SettingsRow
                  key={person.id}
                  icon={
                    <PersonAvatar
                      name={person.name}
                      avatarUrl={person.avatarUrl}
                      colored
                      className="size-8"
                    />
                  }
                  iconClassName="border-0 bg-transparent p-0"
                  title={
                    person.name ?? t("settings-conversations.operators.noName")
                  }
                >
                  <StatusBadge tone="neutral">{person.role}</StatusBadge>
                </SettingsRow>
              ))}
            </SettingsCard>
            <SettingsNote>
              {t("settings-conversations.operators.peopleNote")}
            </SettingsNote>
          </SettingsSection>
          <SettingsSection
            title={t("settings-conversations.operators.teams")}
            description={t("settings-conversations.operators.teamsText")}
          >
            <SettingsCard>
              {teams.data?.teams.length ? (
                teams.data.teams.map((supportTeam) => (
                  <SupportTeamRow
                    key={supportTeam.id}
                    workspaceId={workspaceId}
                    team={supportTeam}
                    members={
                      roster.filter(
                        (member) => member.teamId === supportTeam.id,
                      ).length
                    }
                  />
                ))
              ) : (
                <SettingsEmpty
                  icon={<Users />}
                  title={t("settings-conversations.operators.noTeams")}
                  description={t(
                    "settings-conversations.operators.noTeamsText",
                  )}
                />
              )}
            </SettingsCard>
          </SettingsSection>
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
