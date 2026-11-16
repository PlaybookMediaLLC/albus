import { useTranslation } from "react-i18next";
import { useGetUser } from "../../../hooks/team/use-get-user";
import { useGetUserCompany } from "../../../hooks/team/use-get-user-company";
import { useTeamRuntime } from "../../../team/runtime";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { PropertyRow } from "../../../ui/inbox/property-row";

export interface CustomerSectionProps {
  workspaceId: string;
  principalId: string;
}

/**
 * The customer's details: the company, the plan and the MRR, the country, the locale, when
 * they joined, their feedback activity and their attributes. An anonymous visitor without a
 * profile has none, so the section is left out.
 */
export function CustomerSection(props: CustomerSectionProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const profile = useGetUser(
    {
      param: { workspaceId: props.workspaceId, principalId: props.principalId },
    },
    team.viewer,
  ).data;
  const company = useGetUserCompany(
    {
      param: {
        workspaceId: profile?.companyId ? props.workspaceId : "",
        principalId: props.principalId,
      },
    },
    team.viewer,
  ).data?.company;
  if (!profile) return null;
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 0,
  });
  const activity = (
    [
      ["team-conversations.customer.requestCount", profile.postCount],
      ["team-conversations.customer.voteCount", profile.voteCount],
      ["team-conversations.customer.commentCount", profile.commentCount],
    ] as const
  )
    .filter(([, count]) => count > 0)
    .map(([key, count]) => t(key, { count }))
    .join(" · ");
  const rows = [
    {
      key: "company",
      label: t("team-conversations.customer.company"),
      value: company?.name,
    },
    {
      key: "plan",
      label: t("team-conversations.customer.plan"),
      value: company?.plan,
    },
    {
      key: "mrr",
      label: t("team-conversations.customer.mrr"),
      value:
        company?.mrrCents == null
          ? null
          : number.format(company.mrrCents / 100),
    },
    {
      key: "country",
      label: t("team-conversations.customer.country"),
      value: profile.country,
    },
    {
      key: "locale",
      label: t("team-conversations.customer.locale"),
      value: profile.locale,
    },
    {
      key: "joined",
      label: t("team-conversations.customer.joined"),
      value: new Date(profile.joinedAt).toLocaleDateString(i18n.language, {
        month: "short",
        year: "numeric",
      }),
    },
    {
      key: "activity",
      label: t("team-conversations.customer.activity"),
      value: activity,
    },
    ...profile.attributes.map((attribute) => ({
      key: `attribute:${attribute.key}`,
      label: attribute.key,
      value:
        typeof attribute.value === "boolean"
          ? t(
              attribute.value
                ? "team-conversations.yes"
                : "team-conversations.no",
            )
          : String(attribute.value),
    })),
  ];
  return (
    <PanelSection title={t("team-conversations.customer.title")}>
      {rows
        .filter((row) => row.value)
        .map((row) => (
          <PropertyRow key={row.key} label={row.label}>
            <span className="break-words">{row.value}</span>
          </PropertyRow>
        ))}
    </PanelSection>
  );
}
