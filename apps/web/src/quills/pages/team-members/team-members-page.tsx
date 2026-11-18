import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListUsers } from "../../hooks/team/use-list-users";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { ListHeader } from "../../ui/inbox/list-header";
import { SearchField } from "../../ui/inbox/search-field";
import { PageFrame } from "../../ui/page-frame";
import { EmptyState } from "../../ui/empty-state";
import { MembersArt } from "../../ui/illustrations/members-art";
import { SearchArt } from "../../ui/illustrations/search-art";
import { useDebouncedValue } from "../../ui/upstream";
import { membersInput } from "./members-input";
import { MemberItems } from "./parts/member-items";
import { MoreMembers } from "./parts/more-members";

export interface TeamMembersPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * The customers of the workspace (settings spec A1). Teammates are on Settings › Team:
 * `listQuillsUsers` never lists them.
 */
export function TeamMembersPage({ workspaceId }: TeamMembersPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [text, setText] = useState("");
  const search = useDebouncedValue(text.trim(), 300);
  const first = useListUsers(membersInput(workspaceId, search, 0), team.viewer);
  return (
    <PageFrame titleKey="team-members.title" variant="app" landmark={false}>
      <ListHeader
        title={t("team-members.title")}
        actions={
          <SearchField
            label={t("team-members.search")}
            value={text}
            onChange={setText}
            className="w-full rounded-full bg-muted sm:w-75"
          />
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto [&>[role=alert]]:m-4 [&>[role=status]]:px-4">
        <TeamStateView
          loading={first.isLoading}
          problem={first.error}
          onRetry={() => void first.refetch()}
        >
          {first.data?.items.length ? (
            <ul aria-label={t("team-members.title")} className="pb-6">
              <MemberItems workspaceId={workspaceId} items={first.data.items} />
              {first.data.nextOffset === null ? null : (
                <MoreMembers
                  key={search}
                  workspaceId={workspaceId}
                  search={search}
                  offset={first.data.nextOffset}
                />
              )}
            </ul>
          ) : (
            <EmptyState
              art={search ? <SearchArt /> : <MembersArt />}
              title={
                search
                  ? t("team-members.noMatch", { query: search })
                  : t("team-members.empty")
              }
              description={search ? undefined : t("team-members.emptyText")}
            />
          )}
        </TeamStateView>
      </div>
    </PageFrame>
  );
}
