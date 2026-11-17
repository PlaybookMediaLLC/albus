import { useAction } from "./useAction.js";
import type { WidgetViewProps } from "./types.js";
import { useT } from "./i18n/useT.js";

export function ConnectionStatus({
  loadState,
  connection,
  onRetry,
}: {
  loadState: WidgetViewProps["loadState"];
  connection: WidgetViewProps["connection"];
  onRetry?: () => Promise<unknown>;
}) {
  const t = useT();
  const action = useAction();
  if (connection === "online" && loadState === "ready") return null;
  return (
    <div className="qb-connection" role="status">
      <p>
        {connection === "offline"
          ? t("You’re offline. You can keep reading and writing a draft.")
          : connection === "reconnecting"
            ? t("Reconnecting… Your work stays here.")
            : loadState === "loading"
              ? t("Loading your conversations, help, and updates…")
              : t("Could not load the latest content.")}
      </p>
      {loadState === "error" && connection === "online" && onRetry && (
        <button
          type="button"
          className="qb-text-button"
          disabled={action.pending}
          onClick={() => void action.run(onRetry)}
        >
          {action.pending ? t("Retrying…") : t("Retry loading")}
        </button>
      )}
      {action.error && <p role="alert">{action.error}</p>}
    </div>
  );
}
