import { Calendar, Plug } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MemberCompany } from "./member-company";
import { MemberTraits, type MemberTraitsProps } from "./member-traits";

export interface MemberPanelProps {
  workspaceId: string;
  member: MemberTraitsProps["member"] & {
    joinedAt: string;
    externalId: string | null;
    postCount: number;
    commentCount: number;
    voteCount: number;
    companyId: string | null;
  };
}

/**
 * The right panel of a member: when they joined, the counts that the API gives, their company
 * and the traits. The weekly chart, "Requests shipped" and "Votes received" wait for 5.4.
 */
export function MemberPanel({ workspaceId, member }: MemberPanelProps) {
  const { t, i18n } = useTranslation("quills");
  const joined = new Date(member.joinedAt).toLocaleDateString(i18n.language, {
    dateStyle: "medium",
  });
  const stats = [
    { label: t("team-members.requests"), value: member.postCount },
    { label: t("team-members.commentsTab"), value: member.commentCount },
    { label: t("team-members.votesStat"), value: member.voteCount },
  ];
  return (
    <div className="grid gap-6">
      <ul className="divide-y divide-border rounded-xl border border-border bg-card px-3 text-sm">
        <li className="flex items-center gap-2 py-2.5">
          <Calendar
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          <span className="text-muted-foreground">
            {t("team-members.joined")}
          </span>
          <time dateTime={member.joinedAt} className="font-medium">
            {joined}
          </time>
        </li>
        {member.externalId ? (
          <li className="flex items-center gap-2 py-2.5">
            <Plug aria-hidden="true" className="size-4 text-muted-foreground" />
            {t("team-members.identified")}
          </li>
        ) : null}
      </ul>
      <section aria-labelledby="member-activity" className="grid gap-2">
        <h2 id="member-activity" className="text-sm font-medium">
          {t("team-members.activity")}
        </h2>
        <dl className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-0.5 p-3">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <MemberCompany
        workspaceId={workspaceId}
        principalId={member.principalId}
        companyId={member.companyId}
      />
      <MemberTraits workspaceId={workspaceId} member={member} />
    </div>
  );
}
