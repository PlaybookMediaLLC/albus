import { useTranslation } from "react-i18next";
import { Button, cn, copyToClipboard } from "../../../ui/upstream";
import { tellCopy } from "../copy-rich";

export interface CollectCardProps {
  workspace: string;
  url: string;
  /** False while the portal is off. Undefined when the caller cannot read the portal settings. */
  live?: boolean;
  /** Turns the portal on; only for a teammate with manage_settings. */
  onTurnOn?: () => void;
  turningOn?: boolean;
}

/** The portal: whether customers can open it, its URL, "Copy link" and "Visit". */
export function CollectCard({
  workspace,
  url,
  live,
  onTurnOn,
  turningOn,
}: CollectCardProps) {
  const { t } = useTranslation("quills");
  const off = live === false;
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-6">
      <p className="flex items-center gap-2 font-medium">
        {t(off ? "team-share.collect.off" : "team-share.collect.live", {
          name: workspace,
        })}
        <span
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full",
            off ? "bg-muted-foreground" : "bg-success",
          )}
        />
      </p>
      <p className="text-sm text-muted-foreground">
        {t(off ? "team-share.collect.offHelp" : "team-share.collect.help")}{" "}
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
        {off && onTurnOn ? (
          <Button
            size="sm"
            className="rounded-full"
            disabled={turningOn}
            onClick={onTurnOn}
          >
            {t("team-share.collect.turnOn")}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant={off ? "outline" : undefined}
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
