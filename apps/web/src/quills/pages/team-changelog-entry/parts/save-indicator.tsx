import { Cloud, CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../../ui/inbox/icon-button";
import { cn, Spinner } from "../../../ui/upstream";
import type { SaveState } from "../use-autosave";

export interface SaveIndicatorProps {
  state: SaveState;
  /** The field that a save still needs, for the "unsaved" state. */
  missing?: "title" | "content" | null;
  onRetry: () => void;
}

const messages: Record<SaveState, string> = {
  saved: "team-changelog.editor.saved",
  saving: "team-changelog.editor.saving",
  unsaved: "team-changelog.editor.notSaved",
  failed: "team-changelog.editor.saveFailed",
};

/**
 * The cloud at the bottom left of the editor: saved, saving, not saved yet with the reason,
 * or failed with a retry. The status region announces each change to screen readers.
 */
export function SaveIndicator({ state, missing, onRetry }: SaveIndicatorProps) {
  const { t } = useTranslation("quills");
  const unsaved = state === "unsaved";
  const message =
    unsaved && missing === "title"
      ? t("team-changelog.editor.needsTitle")
      : unsaved && missing === "content"
        ? t("team-changelog.editor.needsContent")
        : t(messages[state]);
  return (
    <div
      className={cn(
        "fixed bottom-4 start-4 flex h-10 items-center justify-center rounded-full border border-border bg-background shadow-xs",
        unsaved ? "gap-2 px-3" : "w-10",
      )}
    >
      {state === "failed" ? (
        <IconButton
          label={message}
          onClick={onRetry}
          className="text-destructive-foreground"
        >
          <CloudOff aria-hidden="true" />
        </IconButton>
      ) : state === "saving" ? (
        <Spinner />
      ) : unsaved ? (
        <CloudOff aria-hidden="true" className="size-4 text-muted-foreground" />
      ) : (
        <Cloud aria-hidden="true" className="size-4 text-muted-foreground" />
      )}
      <span
        role="status"
        aria-live="polite"
        className={unsaved ? "text-sm text-muted-foreground" : "sr-only"}
      >
        {message}
      </span>
    </div>
  );
}
