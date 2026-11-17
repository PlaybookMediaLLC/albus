import { useTranslation } from "react-i18next";
import { useGetPostDemand } from "../../../hooks/team/use-get-post-demand";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { PropertyRow } from "../../../ui/inbox/property-row";

export interface PostDemandProps {
  workspaceId: string;
  postId: string;
}

/** Who asks for a post: companies, their revenue, segments and the importance of the votes. */
export function PostDemand({ workspaceId, postId }: PostDemandProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const demand = useGetPostDemand(
    { param: { workspaceId, postId } },
    team.viewer,
  );
  const data = demand.data;
  const money = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 0,
  });
  return (
    <PanelSection title={t("team-post.demand")}>
      <TeamStateView
        loading={demand.isLoading}
        problem={demand.error}
        onRetry={() => void demand.refetch()}
      >
        {data ? (
          <>
            <PropertyRow label={t("team-post.companies")}>
              {data.companies}
            </PropertyRow>
            {/* Null without quills:view_revenue (#79). */}
            {data.mrrCents === null ? null : (
              <PropertyRow label={t("team-post.mrr")}>
                {money.format(data.mrrCents / 100)}
              </PropertyRow>
            )}
            <PropertyRow label={t("team-post.importance")}>
              {/* Three short counts read better than one sentence that wraps. */}
              <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                {(
                  [
                    ["team-post.nice", data.importance.nice],
                    ["team-post.important", data.importance.important],
                    ["team-post.critical", data.importance.critical],
                  ] as const
                ).map(([key, count]) => (
                  <span key={key}>
                    <span className="font-medium tabular-nums">{count}</span>{" "}
                    <span className="text-muted-foreground">{t(key)}</span>
                  </span>
                ))}
              </span>
            </PropertyRow>
            <PropertyRow label={t("team-post.segments")}>
              {data.segments.length
                ? data.segments
                    .map((segment) =>
                      t("team-post.segmentVoters", {
                        name: segment.name,
                        count: segment.voters,
                      }),
                    )
                    .join(", ")
                : t("team-post.noSegments")}
            </PropertyRow>
          </>
        ) : null}
      </TeamStateView>
    </PanelSection>
  );
}
