import { CircleCheck, CircleDashed, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRowLink } from "../../../ui/inbox/use-row-link";
import { PersonAvatar } from "../../../ui/person-avatar";
import { cn } from "../../../ui/upstream";

export type EntryStatus = "draft" | "scheduled" | "published";

export interface EntryRowProps {
  entry: {
    title: string;
    status: EntryStatus;
    displayDate: string | null;
    publishedAt: string | null;
    createdAt: string;
    author?: { name: string; avatarUrl: string | null } | null;
  };
  href: string;
  onOpen: () => void;
}

const icons = {
  draft: { Icon: CircleDashed, tone: "text-muted-foreground" },
  scheduled: { Icon: Clock, tone: "text-warning-foreground" },
  published: { Icon: CircleCheck, tone: "text-success-foreground" },
} as const;

/** "Nov 5" this year, "Nov 5, 2025" in another year. A scheduled date can be in the future. */
export function entryDate(iso: string, locale: string, now = Date.now()) {
  const date = new Date(iso);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === new Date(now).getFullYear()
      ? {}
      : { year: "numeric" }),
  });
}

/** One changelog entry: the status icon, the title, the date and the author. A click opens the editor. */
export function EntryRow({ entry, href, onOpen }: EntryRowProps) {
  const { t, i18n } = useTranslation("quills");
  const link = useRowLink(onOpen);
  const { Icon, tone } = icons[entry.status];
  const date = entry.displayDate ?? entry.publishedAt ?? entry.createdAt;
  const status = {
    draft: t("team-changelog.status.draft"),
    scheduled: t("team-changelog.status.scheduled"),
    published: t("team-changelog.status.published"),
  }[entry.status];
  return (
    <a
      {...link}
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon
        aria-label={status}
        role="img"
        className={cn("size-4 shrink-0", tone)}
      />
      <span className="min-w-0 flex-1 truncate font-medium">
        {entry.title || t("team-changelog.untitled")}
      </span>
      <time
        dateTime={date}
        className="w-20 shrink-0 text-end text-xs text-muted-foreground"
      >
        {entryDate(date, i18n.language)}
      </time>
      {entry.author ? (
        <>
          <PersonAvatar
            colored
            name={entry.author.name}
            avatarUrl={entry.author.avatarUrl}
          />
          <span className="sr-only">{entry.author.name}</span>
        </>
      ) : null}
    </a>
  );
}
