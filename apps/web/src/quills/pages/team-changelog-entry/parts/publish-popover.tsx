import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetChangelogEntryResponse } from "../../../api/team/get-changelog-entry";
import { portalHref } from "../../../core/portal-href";
import { useUpdateChangelogEntry } from "../../../hooks/team/use-update-changelog-entry";
import { useTeamRuntime } from "../../../team/runtime";
import {
  Button,
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
  toast,
} from "../../../ui/upstream";
import { fromLocalInput, toLocalInput } from "../local-time";
import { DeleteEntry } from "./delete-entry";
import { PublishDetails } from "./publish-details";
import { PublishingCard } from "./publishing-card";
import { StatusLabel } from "./status-label";

export interface PublishPopoverProps {
  workspaceId: string;
  /** Null until the first save creates the entry. */
  entry: GetChangelogEntryResponse | null;
  /** Saves the text now. True when the text is stored. */
  flush: () => Promise<boolean>;
  onDeleted: () => void;
}

/** The status pill and its popover: publish now or later, the link, the details and delete. */
export function PublishPopover({
  workspaceId,
  entry,
  flush,
  onDeleted,
}: PublishPopoverProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const update = useUpdateChangelogEntry(team.viewer);
  const status = entry?.status ?? "draft";
  const [when, setWhen] = useState(status === "scheduled" ? "later" : "now");
  const [at, setAt] = useState(
    status === "scheduled" && entry?.publishedAt
      ? toLocalInput(entry.publishedAt)
      : "",
  );
  const [notify, setNotify] = useState(true);
  const publishAt = fromLocalInput(at);
  const link = entry
    ? new URL(
        portalHref(workspaceId, `changelog/${entry.id}`),
        window.location.origin,
      ).href
    : "";
  const send = async (
    publishState:
      | { type: "draft" }
      | { type: "published"; publishAt?: string }
      | { type: "scheduled"; publishAt: string },
  ) => {
    if (!entry) return;
    // Publish the text that the user sees, not an older save.
    if (publishState.type !== "draft" && !(await flush())) {
      toast.error(t("team-changelog.editor.publishUnsaved"));
      return;
    }
    await update
      .mutateAsync({
        param: { workspaceId, entryId: entry.id },
        json: {
          publishState,
          ...(publishState.type === "draft" ? {} : { notify }),
        },
      })
      .catch(() => toast.error(t("team-changelog.editor.failed")));
  };
  const primary =
    when === "later"
      ? t("team-changelog.editor.schedule")
      : status === "published"
        ? t("team-changelog.editor.update")
        : t("team-changelog.editor.publish");
  const disabled = !team.permissions.update || update.isPending;
  return (
    <Popover>
      <PopoverTrigger
        disabled={!entry}
        render={<Button variant="outline" size="sm" className="rounded-full" />}
      >
        <StatusLabel status={status} />
      </PopoverTrigger>
      <PopoverPopup align="end" className="w-95 max-w-[calc(100vw-2rem)]">
        {entry ? (
          // grid-cols-1 caps the column at the panel width: the link row would stretch it.
          <div className="grid grid-cols-1 gap-4">
            <PopoverTitle className="text-sm font-medium">
              <StatusLabel status={status} />
            </PopoverTitle>
            <section className="grid grid-cols-1 gap-2">
              <h3 className="text-xs text-muted-foreground">
                {t("team-changelog.editor.publishing")}
              </h3>
              <PublishingCard
                when={when}
                onWhenChange={setWhen}
                at={at}
                onAtChange={setAt}
                link={link}
              />
            </section>
            <section className="grid gap-2">
              <h3 className="text-xs text-muted-foreground">
                {t("team-changelog.editor.details")}
              </h3>
              <PublishDetails
                workspaceId={workspaceId}
                entry={entry}
                notify={notify}
                onNotifyChange={setNotify}
              />
            </section>
            <div className="grid gap-2 border-t border-border pt-4">
              <Button
                className="w-full"
                disabled={disabled || (when === "later" && !publishAt)}
                onClick={() =>
                  void send(
                    when === "later" && publishAt
                      ? { type: "scheduled", publishAt }
                      : // "Update" keeps the original publish date.
                        status === "published" && entry.publishedAt
                        ? { type: "published", publishAt: entry.publishedAt }
                        : { type: "published" },
                  )
                }
              >
                {primary}
              </Button>
              {status === "draft" ? null : (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={disabled}
                  onClick={() => void send({ type: "draft" })}
                >
                  {t("team-changelog.editor.unpublish")}
                </Button>
              )}
              <DeleteEntry
                workspaceId={workspaceId}
                entryId={entry.id}
                onDeleted={onDeleted}
              />
            </div>
          </div>
        ) : null}
      </PopoverPopup>
    </Popover>
  );
}
