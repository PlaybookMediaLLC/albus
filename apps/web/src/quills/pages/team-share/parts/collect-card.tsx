import { useTranslation } from "react-i18next";
import { Button, copyToClipboard } from "../../../ui/upstream";
import { tellCopy } from "../copy-rich";

export interface CollectCardProps {
  workspace: string;
  url: string;
}

/** The live portal: its URL, "Copy link" and "Visit". */
export function CollectCard({ workspace, url }: CollectCardProps) {
  const { t } = useTranslation("quills");
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-6">
      <p className="flex items-center gap-2 font-medium">
        {t("team-share.collect.live", { name: workspace })}
        <span aria-hidden="true" className="size-2 rounded-full bg-success" />
      </p>
      <p className="text-sm text-muted-foreground">
        {t("team-share.collect.help")}{" "}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          {url}
        </a>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => void tellCopy(copyToClipboard(url), t)}
        >
          {t("team-share.collect.copy")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          render={<a href={url} target="_blank" rel="noreferrer" />}
        >
          {t("team-share.collect.visit")}
        </Button>
      </div>
    </div>
  );
}
