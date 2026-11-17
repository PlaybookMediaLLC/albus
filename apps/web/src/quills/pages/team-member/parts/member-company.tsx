import { Building2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetUserCompany } from "../../../hooks/team/use-get-user-company";
import { useRemoveUserCompany } from "../../../hooks/team/use-remove-user-company";
import { useSetUserCompany } from "../../../hooks/team/use-set-user-company";
import { useUpdateCompany } from "../../../hooks/team/use-update-company";
import { useTeamRuntime } from "../../../team/runtime";
import { Button } from "../../../ui/upstream";
import { CompanyLinkForm } from "./company-link-form";
import { CompanyRevenueForm } from "./company-revenue-form";

export interface MemberCompanyProps {
  workspaceId: string;
  principalId: string;
  /** The member's company; without one, it is not read. */
  companyId: string | null;
}

type Editing = "company" | "revenue" | null;

/**
 * The member's company with its plan and monthly revenue. A teammate who can update people
 * attaches, changes or removes the company; one who also holds quills:view_revenue sees and
 * sets the revenue (#79).
 */
export function MemberCompany({
  workspaceId,
  principalId,
  companyId,
}: MemberCompanyProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const canEdit = team.permissions.update;
  const revenue = Boolean(team.permissions.viewRevenue);
  const [editing, setEditing] = useState<Editing>(null);
  const param = { workspaceId, principalId };
  const query = useGetUserCompany(
    { param: { ...param, workspaceId: companyId ? workspaceId : "" } },
    team.viewer,
  );
  const attach = useSetUserCompany(team.viewer);
  const remove = useRemoveUserCompany(team.viewer);
  const update = useUpdateCompany(team.viewer);
  const company = companyId ? query.data?.company : null;
  if (!company && !canEdit) return null;
  const money = new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const link = (
    <CompanyLinkForm
      onSubmit={async (name) => {
        await attach.mutateAsync({ param, json: { name } });
        setEditing(null);
      }}
    />
  );
  const action = (labelKey: string, onClick: () => void) => (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      {t(labelKey)}
    </Button>
  );
  return (
    <section aria-labelledby="member-company" className="grid gap-2">
      <h2
        id="member-company"
        className="flex items-center gap-2 text-sm font-medium"
      >
        <Building2
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        {company?.name ?? t("team-members.company")}
      </h2>
      {company ? (
        <dl className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-card">
          <div className="flex flex-col-reverse gap-0.5 p-3">
            <dt className="text-xs text-muted-foreground">
              {t("team-members.plan")}
            </dt>
            <dd className="font-medium">
              {company.plan ?? t("team-members.none")}
            </dd>
          </div>
          {revenue ? (
            <div className="flex flex-col-reverse gap-0.5 p-3">
              <dt className="text-xs text-muted-foreground">
                {t("team-members.mrr")}
              </dt>
              <dd className="font-medium tabular-nums">
                {company.mrrCents === null
                  ? t("team-members.none")
                  : money.format(company.mrrCents / 100)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("team-members.noCompany")}
        </p>
      )}
      {canEdit && !editing ? (
        <div className="flex flex-wrap gap-1">
          {company && revenue
            ? action("team-members.editRevenue", () => setEditing("revenue"))
            : null}
          {action(
            company ? "team-members.changeCompany" : "team-members.addCompany",
            () => setEditing("company"),
          )}
          {company
            ? action("team-members.removeCompany", () =>
                remove.mutate({ param }),
              )
            : null}
        </div>
      ) : null}
      {editing === "company" ? link : null}
      {editing === "revenue" && company ? (
        <CompanyRevenueForm
          mrrCents={company.mrrCents}
          onSubmit={async (mrrCents) => {
            await update.mutateAsync({
              param: { workspaceId, companyId: company.id },
              json: { mrrCents },
            });
            setEditing(null);
          }}
        />
      ) : null}
      {remove.error ? (
        <p role="alert" className="text-sm text-destructive-foreground">
          {t("core.problem.failed")}
        </p>
      ) : null}
    </section>
  );
}
