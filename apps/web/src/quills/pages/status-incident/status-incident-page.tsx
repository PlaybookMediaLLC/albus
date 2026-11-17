import { useTranslation } from "react-i18next";
import { portalHref } from "../../core/portal-href";
import { useGetPublicStatusIncident } from "../../hooks/status/use-get-public-status-incident";
import { usePortalRuntime } from "../../portal/runtime";
import { PageFrame } from "../../ui/page-frame";
import { PortalGate } from "../../ui/portal-gate";
import { StateView } from "../../ui/state-view";
import { meta } from "./meta";

// The API sends enum values; the page names them in words.
const stateKeys = {
  investigating: "status-incident.state.investigating",
  identified: "status-incident.state.identified",
  monitoring: "status-incident.state.monitoring",
  resolved: "status-incident.state.resolved",
  scheduled: "status-incident.state.scheduled",
  in_progress: "status-incident.state.in_progress",
  verifying: "status-incident.state.verifying",
  completed: "status-incident.state.completed",
} as const;
const impactKeys = {
  none: "status-incident.impactLevel.none",
  minor: "status-incident.impactLevel.minor",
  major: "status-incident.impactLevel.major",
  critical: "status-incident.impactLevel.critical",
  maintenance: "status-incident.impactLevel.maintenance",
} as const;
const componentKeys = {
  operational: "status-incident.componentState.operational",
  under_maintenance: "status-incident.componentState.under_maintenance",
  degraded_performance: "status-incident.componentState.degraded_performance",
  partial_outage: "status-incident.componentState.partial_outage",
  major_outage: "status-incident.componentState.major_outage",
} as const;
export interface StatusIncidentPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}
export function StatusIncidentPage(props: StatusIncidentPageProps) {
  const { t } = useTranslation("quills");
  const portal = usePortalRuntime();
  // As on the feedback pages: no request until the private-portal gate admits the caller.
  const workspace =
    !portal.accessLoading && portal.access?.granted === true
      ? props.workspaceId
      : "";
  const incident = useGetPublicStatusIncident(
    {
      param: {
        workspace,
        incidentId: props.params.incidentId ?? "",
      },
    },
    portal.viewer,
  );

  return (
    <PageFrame
      titleKey="status-incident.title"
      displayTitle={incident.data?.title}
      token="none"
      tokenScope={undefined}
      persistToken={false}
    >
      <StateView
        loading={portal.accessLoading}
        problem={portal.accessProblem}
        onRetry={portal.retryAccess}
      >
        <PortalGate
          workspaceId={props.workspaceId}
          currentPath={portalHref(
            props.workspaceId,
            `status/incidents/${props.params.incidentId ?? ""}`,
          )}
          audience={meta.audience}
          portalEnabled
          accessGranted={portal.access?.granted ?? false}
          signedIn={portal.viewer.kind === "user"}
        >
          <StateView
            loading={incident.isLoading}
            problem={incident.error ?? null}
            onRetry={() => {
              void incident.refetch();
            }}
          >
            {incident.data ? (
              <article className="space-y-6 text-sm">
                <p>
                  {t("status-incident.status", {
                    status: t(stateKeys[incident.data.status]),
                  })}
                </p>
                <p>
                  {t("status-incident.impact", {
                    impact: t(impactKeys[incident.data.impact]),
                  })}
                </p>
                <p>
                  {t(
                    incident.data.scheduledStartAt
                      ? "status-incident.scheduled"
                      : "status-incident.started",
                    {
                      date: new Date(
                        incident.data.scheduledStartAt ??
                          incident.data.startedAt,
                      ).toLocaleString(),
                    },
                  )}
                </p>
                <section
                  aria-labelledby="affected-components-heading"
                  className="space-y-4"
                >
                  <h3
                    id="affected-components-heading"
                    className="text-base font-semibold"
                  >
                    {t("status-incident.affectedComponents")}
                  </h3>
                  {incident.data.affectedComponents.length ? (
                    <ul>
                      {incident.data.affectedComponents.map((component) => (
                        <li key={component.id}>
                          {t("status-incident.componentStatus", {
                            name: component.name,
                            status: t(componentKeys[component.componentStatus]),
                          })}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t("status-incident.noAffectedComponents")}</p>
                  )}
                </section>
                <section
                  aria-labelledby="incident-updates-heading"
                  className="space-y-4"
                >
                  <h3
                    id="incident-updates-heading"
                    className="text-base font-semibold"
                  >
                    {t("status-incident.updates")}
                  </h3>
                  {incident.data.updates.length ? (
                    <ol className="space-y-6">
                      {incident.data.updates.map((update) => (
                        <li
                          key={update.id}
                          className="space-y-2 border-l border-border pl-5"
                        >
                          <p>
                            {t("status-incident.status", {
                              status: t(stateKeys[update.status]),
                            })}
                          </p>
                          <p>{update.body}</p>
                          <time
                            className="text-xs text-muted-foreground"
                            dateTime={update.createdAt}
                          >
                            {new Date(update.createdAt).toLocaleString()}
                          </time>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>{t("status-incident.noUpdates")}</p>
                  )}
                </section>
              </article>
            ) : null}
          </StateView>
        </PortalGate>
      </StateView>
    </PageFrame>
  );
}
