import { useTranslation } from "react-i18next";
import { RowBadge } from "../../../ui/inbox/row-badge";
import { useRowLink } from "../../../ui/inbox/use-row-link";
import { PersonAvatar } from "../../../ui/person-avatar";

export interface MemberRowProps {
  member: {
    name: string;
    image: string | null;
    email: string | null;
    contactEmail: string | null;
    isLead: boolean;
    blockedAt: string | null;
  };
  href: string;
  onOpen: () => void;
}

/** One person of the Members list: avatar, name, email and the Lead and Blocked badges. */
export function MemberRow({ member, href, onOpen }: MemberRowProps) {
  const { t } = useTranslation("quills");
  const link = useRowLink(onOpen);
  const email = member.email ?? member.contactEmail;
  return (
    <a
      {...link}
      href={href}
      className="mx-2 flex items-center gap-3 rounded-lg px-2 outline-none transition-colors duration-150 hover:bg-accent focus-visible:bg-foreground/6"
    >
      <PersonAvatar
        name={member.name}
        avatarUrl={member.image}
        colored
        className="size-8 text-xs"
      />
      <span className="flex min-h-12 min-w-0 flex-1 items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {member.name}
          </span>
          {email ? (
            <span className="block truncate text-xs text-muted-foreground">
              {email}
            </span>
          ) : null}
        </span>
        {member.isLead ? (
          <RowBadge
            badge={{ id: "lead", label: t("team-members.lead"), tone: "info" }}
          />
        ) : null}
        {member.blockedAt ? (
          <RowBadge
            badge={{
              id: "blocked",
              label: t("team-members.blocked"),
              tone: "error",
            }}
          />
        ) : null}
      </span>
    </a>
  );
}
