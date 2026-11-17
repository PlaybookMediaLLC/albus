import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetUser } from "../../hooks/team/use-get-user";
import { teamHref } from "../../team/team-href";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { IconButton } from "../../ui/inbox/icon-button";
import { PageFrame } from "../../ui/page-frame";
import { PersonAvatar } from "../../ui/person-avatar";
import { MemberMenu } from "./parts/member-menu";
import { MemberPanel } from "./parts/member-panel";
import { MemberTabs } from "./parts/member-tabs";

export interface TeamMemberPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * One customer (settings spec A2): the requests and comments tabs, and a panel with the
 * join date, the counts and the traits. The kebab blocks, unblocks or removes the person.
 */
export function TeamMemberPage({ workspaceId, params }: TeamMemberPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const principalId = params.principalId ?? "";
  const user = useGetUser({ param: { workspaceId, principalId } }, team.viewer);
  const member = user.data;
  const back = () => void navigate({ to: teamHref(workspaceId, "/members") });
  return (
    <PageFrame
      titleKey="team-members.member"
      displayTitle={member?.name}
      variant="app"
      landmark={false}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <div className="min-w-0 flex-1 md:overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2">
            <IconButton label={t("team-members.back")} onClick={back}>
              <ChevronLeft aria-hidden="true" />
            </IconButton>
            {member ? (
              <MemberMenu
                workspaceId={workspaceId}
                member={member}
                onRemoved={back}
              />
            ) : null}
          </div>
          <div className="mx-auto w-full max-w-200 px-6 pb-10 pt-6 md:pt-10">
            {member ? (
              <PersonAvatar
                name={member.name}
                avatarUrl={member.image}
                colored
                className="mb-6 size-18 text-2xl"
              />
            ) : null}
            <h1
              tabIndex={-1}
              className="break-words text-3xl font-semibold tracking-tight outline-none md:text-4xl"
            >
              {member?.name ?? t("team-members.member")}
            </h1>
            <div className="[&>[role=alert]]:mt-6 [&>[role=status]]:mt-2">
              <TeamStateView
                loading={user.isLoading}
                problem={user.error}
                onRetry={() => void user.refetch()}
              >
                {member ? (
                  <MemberTabs
                    workspaceId={workspaceId}
                    principalId={principalId}
                    postCount={member.postCount}
                    commentCount={member.commentCount}
                  />
                ) : null}
              </TeamStateView>
            </div>
          </div>
        </div>
        {member ? (
          <aside
            aria-label={t("team-members.details")}
            className="shrink-0 border-t border-border p-4 md:w-90 md:overflow-y-auto md:border-s md:border-t-0"
          >
            <MemberPanel workspaceId={workspaceId} member={member} />
          </aside>
        ) : null}
      </div>
    </PageFrame>
  );
}
