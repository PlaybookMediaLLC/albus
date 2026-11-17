import { useTranslation } from "react-i18next";
import type { GetPublicStatusPageResponse } from "../../../api/status/get-public-status-page";
import type { GetPublicStatusUptimeResponse } from "../../../api/status/get-public-status-uptime";
import type { ListPublicStatusHistoryResponse } from "../../../api/status/list-public-status-history";
import { portalHref } from "../../../core/portal-href";
import { Button, Card, cn } from "../../../ui/upstream";

export interface StatusContentProps {
  workspaceId: string;
  page: GetPublicStatusPageResponse;
  uptime: GetPublicStatusUptimeResponse | undefined;
  incidents: ListPublicStatusHistoryResponse["items"];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export function StatusContent(props: StatusContentProps) {
  const { t } = useTranslation("quills");
  const statusLabels = {
    operational: t("status.status.operational"),
    under_maintenance: t("status.status.under_maintenance"),
    degraded_performance: t("status.status.degraded_performance"),
    partial_outage: t("status.status.partial_outage"),
    major_outage: t("status.status.major_outage"),
  };
  const components = [
    ...props.page.groups.flatMap((group) => group.components),
    ...props.page.ungroupedComponents,
  ];
  const incidentLink = (id: string) =>
    portalHref(props.workspaceId, `status/incidents/${id}`);

  const section = "gap-3 p-6 text-sm";
  const heading = "text-base font-semibold";
  const incidentList = (
    items: ReadonlyArray<{ id: string; title: string }>,
  ) => (
    <ul className="grid gap-2">
      {items.map((incident) => (
        <li key={incident.id}>
          <a
            className="underline-offset-4 hover:underline"
            href={incidentLink(incident.id)}
          >
            {incident.title}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="portal-status grid max-w-4xl gap-6">
      <Card
        render={<section aria-labelledby="status-overview" />}
        className={cn(section, "portal-status-overview gap-4 bg-muted")}
        data-status={props.page.topLevelStatus}
      >
        <h2
          id="status-overview"
          className="flex items-center gap-2 text-xl font-semibold"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full",
              props.page.topLevelStatus === "operational"
                ? "bg-success"
                : "bg-warning",
            )}
          />
          {statusLabels[props.page.topLevelStatus]}
        </h2>
        {props.page.pageDescription ? (
          <p>{props.page.pageDescription}</p>
        ) : null}
        {components.length ? (
          <ul className="grid divide-y divide-border">
            {components.map((component) => (
              <li key={component.id} className="py-3 first:pt-0 last:pb-0">
                {t("status.componentStatus", {
                  name: component.name,
                  status: statusLabels[component.status],
                })}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
      <Card
        render={<section aria-labelledby="status-active" />}
        className={section}
      >
        <h2 id="status-active" className={heading}>
          {t("status.active")}
        </h2>
        {props.page.activeIncidents.length ? (
          incidentList(props.page.activeIncidents)
        ) : (
          <p>{t("status.noActive")}</p>
        )}
      </Card>
      {props.page.upcomingMaintenance.length ? (
        <Card
          render={<section aria-labelledby="status-maintenance" />}
          className={section}
        >
          <h2 id="status-maintenance" className={heading}>
            {t("status.maintenance")}
          </h2>
          {incidentList(props.page.upcomingMaintenance)}
        </Card>
      ) : null}
      <Card
        render={<section aria-labelledby="status-uptime" />}
        className={section}
      >
        <h2 id="status-uptime" className={heading}>
          {t("status.uptime")}
        </h2>
        {props.uptime?.series.flatMap((series) =>
          series.days.slice(-7).map((day) => (
            <p key={`${series.componentId}-${day.date}`}>
              {t("status.uptimeDay", {
                date: day.date,
                percent: day.uptimePct,
              })}
            </p>
          )),
        )}
      </Card>
      <Card
        render={<section aria-labelledby="status-history" />}
        className={section}
      >
        <h2 id="status-history" className={heading}>
          {t("status.history")}
        </h2>
        {props.incidents.length ? (
          incidentList(props.incidents)
        ) : (
          <p>{t("status.noHistory")}</p>
        )}
        {props.hasMore ? (
          <Button
            className="self-start"
            onClick={props.onLoadMore}
            disabled={props.loadingMore}
          >
            {t("status.loadMore")}
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
