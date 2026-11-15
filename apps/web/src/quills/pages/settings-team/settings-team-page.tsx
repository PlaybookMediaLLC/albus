import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import {
  Button,
  InviteTeamMemberModal,
  MembersTable,
  SettingsPage,
  useGetFullWorkspace,
  useWorkspacePermission,
} from "../../ui/upstream";

export interface SettingsTeamPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * Settings › Team (settings spec B12): Kaneo's workspace members and invitations. Kaneo's
 * own table and invite dialog check the Kaneo capabilities.
 */
export function SettingsTeamPage({ workspaceId }: SettingsTeamPageProps) {
  const { t } = useTranslation("quills");
  const workspace = useGetFullWorkspace({ workspaceId });
  const { canInviteUsers } = useWorkspacePermission();
  const [inviting, setInviting] = useState(false);
  return (
    <PageFrame
      titleKey="settings-workspace.team.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-workspace.team.title")}
        description={t("settings-workspace.team.description")}
        actions={
          canInviteUsers() ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviting(true)}
            >
              <UserPlus aria-hidden="true" />
              {t("settings-workspace.team.invite")}
            </Button>
          ) : null
        }
      >
        <TeamStateView
          loading={workspace.isPending}
          problem={workspace.isError ? { kind: "failed" } : null}
        >
          <MembersTable
            workspaceId={workspaceId}
            users={workspace.data?.members ?? []}
            invitations={workspace.data?.invitations ?? []}
          />
        </TeamStateView>
        <InviteTeamMemberModal
          open={inviting}
          onClose={() => setInviting(false)}
        />
      </SettingsPage>
    </PageFrame>
  );
}
