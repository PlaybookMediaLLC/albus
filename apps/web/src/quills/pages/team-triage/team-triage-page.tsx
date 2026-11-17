import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetRevenueAtRisk } from "../../hooks/team/use-get-revenue-at-risk";
import { useGetScoringFactors } from "../../hooks/team/use-get-scoring-factors";
import { useListPosts } from "../../hooks/team/use-list-posts";
import { useListSegments } from "../../hooks/team/use-list-segments";
import { useSetPostFactorScores } from "../../hooks/team/use-set-post-factor-scores";
import { useSetPostScore } from "../../hooks/team/use-set-post-score";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { ListHeader } from "../../ui/inbox/list-header";
import { PageFrame } from "../../ui/page-frame";
import {
  Button,
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
} from "../../ui/upstream";
import { filterQuery, noFilters } from "./triage-filter-query";
import { TriageFilters } from "./parts/triage-filters";
import { TriageTable, type TriageEditing } from "./parts/triage-table";

export interface TeamTriagePageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

const sorts = [
  { value: "votes", labelKey: "team-triage.sortVotes" },
  { value: "mrr", labelKey: "team-triage.sortMrr" },
  { value: "rice", labelKey: "team-triage.sortRice" },
  { value: "score", labelKey: "team-triage.sortScore" },
] as const;
type Sort = (typeof sorts)[number]["value"];
// The scroll area under the header. The loading, empty and error states get a margin.
const body =
  "min-h-0 flex-1 overflow-y-auto [&>[role=alert]]:m-4 [&>[role=status]]:px-4";

// Requests ranked by votes, customer revenue, RICE or the team score, filtered by customer value,
// with the revenue at risk (#79).
export function TeamTriagePage({ workspaceId }: TeamTriagePageProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const [sort, setSort] = useState<Sort>("votes");
  const [editing, setEditing] = useState<TriageEditing | null>(null);
  const [filters, setFilters] = useState(noFilters);
  const param = { workspaceId };
  const posts = useListPosts(
    { param, query: { sort, limit: "50", ...filterQuery(filters) } },
    team.viewer,
  );
  // Revenue needs quills:view_revenue (#79): without it, no revenue request, column or order.
  const revenue = Boolean(team.permissions.viewRevenue);
  const risk = useGetRevenueAtRisk(
    { param: { workspaceId: revenue ? workspaceId : "" } },
    team.viewer,
  );
  const factors = useGetScoringFactors({ param }, team.viewer);
  const segments = useListSegments({ param }, team.viewer);
  const score = useSetPostScore(team.viewer);
  const factorScores = useSetPostFactorScores(team.viewer);
  const queries = [posts, risk, factors, segments];
  const money = (cents: number) =>
    new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }).format(
      cents / 100,
    );

  return (
    <PageFrame titleKey="team-triage.title" variant="app" landmark={false}>
      <ListHeader
        title={t("team-triage.title")}
        filters={
          <MenuRadioGroup
            value={sort}
            onValueChange={(value) => setSort(value as Sort)}
          >
            <MenuGroupLabel>{t("team-triage.sort")}</MenuGroupLabel>
            {sorts
              .filter((item) => revenue || item.value !== "mrr")
              .map((item) => (
                <MenuRadioItem key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </MenuRadioItem>
              ))}
          </MenuRadioGroup>
        }
      />
      <div className={body}>
        <TeamStateView
          loading={queries.some((query) => query.isLoading)}
          problem={queries.find((query) => query.error)?.error ?? null}
          onRetry={() => {
            for (const query of queries) void query.refetch();
          }}
        >
          {revenue ? (
            <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {t("team-triage.risk")}
              </span>{" "}
              {t("team-triage.riskValue", {
                amount: money(risk.data?.mrrCents ?? 0),
                count: risk.data?.companies ?? 0,
              })}
            </p>
          ) : null}
          <TriageFilters
            segments={segments.data?.segments ?? []}
            withScore={Boolean(factors.data?.factors.length)}
            withRevenue={revenue}
            value={filters}
            onApply={setFilters}
          />
          {factors.data?.factors.length ||
          !team.permissions.manageSettings ? null : (
            <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
              {t("team-triage.noFactors")}
            </p>
          )}
          <TriageTable
            posts={posts.data?.pages.flatMap((page) => page.items) ?? []}
            money={money}
            canScore={team.permissions.update}
            revenue={revenue}
            factors={factors.data?.factors ?? []}
            editing={editing}
            onEdit={setEditing}
            onScore={async (postId, json) => {
              await score.mutateAsync({ param: { workspaceId, postId }, json });
              setEditing(null);
            }}
            onScoreFactors={async (postId, values) => {
              await factorScores.mutateAsync({
                param: { workspaceId, postId },
                json: {
                  values: Object.entries(values).map(([factorId, value]) => ({
                    factorId,
                    value,
                  })),
                },
              });
              setEditing(null);
            }}
          />
          {posts.hasNextPage ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              loading={posts.isFetchingNextPage}
              onClick={() => void posts.fetchNextPage()}
            >
              {t("team-triage.loadMore")}
            </Button>
          ) : null}
        </TeamStateView>
      </div>
    </PageFrame>
  );
}
