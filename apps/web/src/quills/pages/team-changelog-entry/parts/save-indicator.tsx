import { Cloud, CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../../ui/inbox/icon-button";
import { Spinner } from "../../../ui/upstream";
import type { SaveState } from "../use-autosave";

export interface SaveIndicatorProps {
  state: SaveState;
  onRetry: () => void;
}

/** The cloud at the bottom left of the editor: saved, saving, or failed with a retry. */
export function SaveIndicator({ state, onRetry }: SaveIndicatorProps) {
  const { t } = useTranslation("quills");
  return (
    <div className="fixed bottom-4 start-4 flex size-10 items-center justify-center rounded-full border border-border bg-background shadow-xs">
      {state === "failed" ? (
        <IconButton
          label={t("team-changelog.editor.saveFailed")}
          onClick={onRetry}
          className="text-destructive-foreground"
        >
          <CloudOff aria-hidden="true" />
        </IconButton>
      ) : (
        <span role="status" aria-live="polite" className="flex">
          <span className="sr-only">
            {t(
              state === "saving"
                ? "team-changelog.editor.saving"
                : "team-changelog.editor.saved",
            )}
          </span>
          {state === "saving" ? (
            <Spinner />
          ) : (
            <Cloud
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
          )}
        </span>
      )}
    </div>
  );
}
