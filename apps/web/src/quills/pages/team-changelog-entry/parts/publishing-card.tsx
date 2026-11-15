import { Link as LinkIcon, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CopyField } from "../../../ui/copy-field";
import {
  Button,
  copyToClipboard,
  Input,
  toast,
  ToggleGroup,
  ToggleGroupItem,
} from "../../../ui/upstream";

export interface PublishingCardProps {
  /** "now" or "later". */
  when: string;
  onWhenChange: (when: string) => void;
  /** The value of the datetime-local field. */
  at: string;
  onAtChange: (at: string) => void;
  /** The portal URL of the entry. */
  link: string;
}

/** The Publishing card of the publish popover: now or later, the date, and the link. */
export function PublishingCard({
  when,
  onWhenChange: setWhen,
  at,
  onAtChange: setAt,
  link,
}: PublishingCardProps) {
  const { t } = useTranslation("quills");
  return (
    <>
      <div className="divide-y divide-border rounded-xl border border-border text-sm">
        <div className="flex min-h-10 items-center gap-2 px-3">
          <Rocket aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground">
            {t("team-changelog.editor.publishWhen")}
          </span>
          <ToggleGroup
            aria-label={t("team-changelog.editor.publishWhen")}
            size="sm"
            value={[when]}
            onValueChange={(next) => next[0] && setWhen(String(next[0]))}
          >
            <ToggleGroupItem value="now">
              {t("team-changelog.editor.now")}
            </ToggleGroupItem>
            <ToggleGroupItem value="later">
              {t("team-changelog.editor.later")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {when === "later" ? (
          <label className="flex min-h-10 items-center gap-2 px-3">
            <span className="flex-1 text-muted-foreground">
              {t("team-changelog.editor.date")}
            </span>
            <Input
              type="datetime-local"
              size="sm"
              className="w-auto"
              value={at}
              onChange={(event) => setAt(event.target.value)}
            />
          </label>
        ) : null}
        <div className="flex min-h-10 items-center gap-2 px-3">
          <LinkIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="text-muted-foreground">
            {t("team-changelog.editor.link")}
          </span>
          <div className="min-w-0 flex-1">
            <CopyField value={link} label={t("team-changelog.editor.link")} />
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={async () =>
          (await copyToClipboard(link))
            ? toast.success(t("settings.copied"))
            : toast.error(t("settings.copyFailed"))
        }
      >
        {t("team-changelog.editor.copyLink")}
      </Button>
    </>
  );
}
