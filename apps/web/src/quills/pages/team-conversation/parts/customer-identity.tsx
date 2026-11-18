import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetUser } from "../../../hooks/team/use-get-user";
import { useTeamRuntime } from "../../../team/runtime";
import { teamHref } from "../../../team/team-href";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PersonAvatar } from "../../../ui/person-avatar";
import { copyToClipboard, toast } from "../../../ui/upstream";

export interface CustomerIdentityProps {
  workspaceId: string;
  principalId: string;
  /** The conversation's copy of the customer, shown when no profile loads. */
  name: string | null;
  avatarUrl?: string | null;
  email: string | null;
}

const chip = "flex items-center gap-1 rounded-full bg-muted px-2 text-xs";

/**
 * The top of the right panel: the avatar, the name and the email with a copy button, a link to
 * the customer's profile, and their segments and tags. An anonymous visitor has no profile.
 */
export function CustomerIdentity(props: CustomerIdentityProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const profile = useGetUser(
    {
      param: { workspaceId: props.workspaceId, principalId: props.principalId },
    },
    team.viewer,
  ).data;
  const name = profile?.name ?? props.name ?? t("team-conversations.unknown");
  const email = profile?.email ?? profile?.contactEmail ?? props.email;
  const badges = [
    profile?.isLead && t("team-conversations.customer.lead"),
    profile?.blockedAt && t("team-conversations.customer.blocked"),
  ].filter((badge): badge is string => Boolean(badge));
  const labels = [...(profile?.segments ?? []), ...(profile?.tags ?? [])];
  const copy = async () =>
    email && (await copyToClipboard(email))
      ? toast.success(t("team-conversations.customer.copied"))
      : toast.error(t("team-conversations.customer.copyFailed"));
  return (
    <section
      aria-labelledby="conversation-customer"
      className="grid gap-2 pb-3"
    >
      <div className="flex items-center gap-3">
        <PersonAvatar
          colored
          name={name}
          avatarUrl={profile?.image ?? props.avatarUrl}
          className="size-10 shrink-0 text-sm"
        />
        <div className="min-w-0 flex-1">
          <h2
            id="conversation-customer"
            className="truncate font-semibold leading-tight"
          >
            {name}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {email ?? t("team-conversations.customer.noEmail")}
          </p>
        </div>
        {email ? (
          <IconButton
            label={t("team-conversations.customer.copyEmail")}
            onClick={() => void copy()}
          >
            <Copy aria-hidden="true" />
          </IconButton>
        ) : null}
        {profile ? (
          <IconButton
            label={t("team-conversations.customer.profile")}
            render={
              <Link
                to={teamHref(
                  props.workspaceId,
                  `/members/${props.principalId}`,
                )}
              />
            }
          >
            <ArrowUpRight aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>
      {badges.length || labels.length ? (
        <ul
          aria-label={t("team-conversations.customer.labels")}
          className="flex flex-wrap gap-1"
        >
          {badges.map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-border px-2 text-xs text-muted-foreground"
            >
              {badge}
            </li>
          ))}
          {labels.map((label) => (
            <li key={label.id} className={chip}>
              <svg
                viewBox="0 0 6 6"
                aria-hidden="true"
                color={label.color}
                className="size-1.5"
              >
                <circle cx="3" cy="3" r="3" fill="currentColor" />
              </svg>
              {label.name}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
