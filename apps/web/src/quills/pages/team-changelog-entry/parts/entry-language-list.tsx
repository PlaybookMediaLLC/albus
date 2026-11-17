import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/upstream";

type Version = { locale: string; title: string; content: string };

export interface EntryLanguageListProps {
  versions: readonly Version[];
  /** The language whose delete is running. */
  deleting?: string;
  /** Without these, the list is read-only. */
  onEdit?: (version: Version) => void;
  onDelete?: (locale: string) => void;
}

/** The entry's versions in other languages, each with edit and delete when allowed. */
export function EntryLanguageList(props: EntryLanguageListProps) {
  const { t } = useTranslation("quills");
  if (!props.versions.length)
    return (
      <p className="text-sm text-muted-foreground">
        {t("team-changelog.languages.none")}
      </p>
    );
  return (
    <ul className="grid gap-2">
      {props.versions.map((version) => (
        <li
          key={version.locale}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <span className="min-w-0">
            <span className="font-mono text-xs text-muted-foreground">
              {version.locale}
            </span>{" "}
            <span dir="auto">{version.title}</span>
          </span>
          {props.onEdit && props.onDelete ? (
            <span className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => props.onEdit!(version)}
              >
                {t("team-changelog.languages.edit", { locale: version.locale })}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={props.deleting === version.locale}
                onClick={() => props.onDelete!(version.locale)}
              >
                {t("team-changelog.languages.delete", {
                  locale: version.locale,
                })}
              </Button>
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
