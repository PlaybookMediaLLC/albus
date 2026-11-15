import { useTranslation } from "react-i18next";
import { cn } from "../../../ui/upstream";

export type EntryStatus = "draft" | "scheduled" | "published";

const dots = {
  draft: "bg-muted-foreground",
  scheduled: "bg-warning",
  published: "bg-success",
} as const;

export interface StatusLabelProps {
  status: EntryStatus;
}

/** The status name of a changelog entry and its dot: gray, amber or green. */
export function StatusLabel({ status }: StatusLabelProps) {
  const { t } = useTranslation("quills");
  const name = {
    draft: t("team-changelog.status.draft"),
    scheduled: t("team-changelog.status.scheduled"),
    published: t("team-changelog.status.published"),
  }[status];
  return (
    <span className="inline-flex items-center gap-2">
      {name}
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", dots[status])}
      />
    </span>
  );
}
