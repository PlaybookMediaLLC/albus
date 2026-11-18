import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { portalHref } from "../../../core/portal-href";
import { useListChangelogEngagement } from "../../../hooks/team/use-list-changelog-engagement";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { Button } from "../../../ui/upstream";
import { EngagementRow } from "./engagement-row";
import { EmptyState } from "../../../ui/empty-state";
import { ChangelogArt } from "../../../ui/illustrations/changelog-art";

export interface EngagementListProps {
  workspaceId: string;
}

/** The Engagement tab: published updates with their readers and reactions (RFC 0003, feature 14). */
export function EngagementList({ workspaceId }: EngagementListProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const list = useListChangelogEngagement(
    { param: { workspaceId }, query: {} },
    team.viewer,
  );
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  // A row opens the update as customers see it on the portal.
  const href = (id: string) =>
    portalHref(workspaceId, `changelog/${encodeURIComponent(id)}`);
  return (
    <TeamStateView
      loading={list.isLoading}
      problem={list.error}
      empty={!items.length}
      emptyState={
        <EmptyState
          art={<ChangelogArt />}
          title={t("empty.engagement.title")}
          description={t("empty.engagement.body")}
        />
      }
      onRetry={() => void list.refetch()}
    >
      <ul
        aria-label={t("team-changelog.tabs.engagement")}
        className="grid grid-cols-1 gap-0.5"
      >
        {items.map((item) => (
          <li key={item.id}>
            <EngagementRow
              item={item}
              href={href(item.id)}
              onOpen={() => void navigate({ to: href(item.id) })}
            />
          </li>
        ))}
      </ul>
      {list.hasNextPage ? (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => list.fetchNextPage()}
          loading={list.isFetchingNextPage}
        >
          {t("team-changelog.loadMore")}
        </Button>
      ) : null}
    </TeamStateView>
  );
}
