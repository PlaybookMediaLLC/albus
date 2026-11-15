import { useTranslation } from "react-i18next";
import { Button, copyToClipboard, Skeleton } from "../../../ui/upstream";
import { tellCopy } from "../copy-rich";
import type { SiteArea } from "../share-links";

export interface SiteLinksCardProps {
  workspace: string;
  links: readonly { area: SiteArea; url: string }[];
}

/** A footer preview with the open portal areas, and "Copy all links" (one URL on each line). */
export function SiteLinksCard({ workspace, links }: SiteLinksCardProps) {
  const { t } = useTranslation("quills");
  const names: Record<SiteArea, string> = {
    feedback: t("team-share.site.feedback"),
    roadmap: t("team-share.site.roadmap"),
    changelog: t("team-share.site.changelog"),
  };
  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div aria-hidden="true" className="grid gap-2 p-6">
          <Skeleton className="h-2 w-3/5" />
          <Skeleton className="h-2 w-2/5" />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border px-6 py-3 text-sm">
          <span className="flex-1 text-muted-foreground">
            {t("team-share.site.copyright", { workspace })}
          </span>
          {links.length ? (
            links.map((link) => (
              <a
                key={link.area}
                href={link.url}
                target="_blank"
                rel="noreferrer"
              >
                {names[link.area]}
              </a>
            ))
          ) : (
            <span className="text-muted-foreground">
              {t("team-share.site.none")}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-fit rounded-full"
        disabled={!links.length}
        onClick={() =>
          void tellCopy(
            copyToClipboard(links.map((link) => link.url).join("\n")),
            t,
          )
        }
      >
        {t("team-share.site.copy")}
      </Button>
    </div>
  );
}
