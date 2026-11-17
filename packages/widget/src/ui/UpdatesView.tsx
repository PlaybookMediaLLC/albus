import { UpdateCard } from "./UpdateCard.js";
import { UpdateActions } from "./UpdateActions.js";
import { Icon } from "./Icon.js";
import { useAction } from "./useAction.js";
import type { UpdateEntry, WidgetViewProps } from "./types.js";
import { useLocale, useT } from "./i18n/useT.js";
import { updateDate } from "./message-time.js";

export function UpdatesView({
  entries,
  onOpen,
  onReact,
  onShare,
  subscribed,
  onSubscribe,
}: {
  entries: readonly UpdateEntry[];
  onOpen: (id: string) => void;
  onReact?: WidgetViewProps["onReactToUpdate"];
  onShare?: WidgetViewProps["onShareUpdate"];
  subscribed?: boolean;
  onSubscribe?: WidgetViewProps["onSubscribeUpdates"];
}) {
  const t = useT();
  const locale = useLocale();
  const action = useAction();
  return (
    <div className="qb-list-view qb-updates">
      <h1>{t("Updates")}</h1>
      {onSubscribe && subscribed !== undefined && (
        <div className="qb-updates-subscribe">
          <button
            type="button"
            className="qb-text-button"
            aria-pressed={subscribed}
            disabled={action.pending}
            onClick={() => void action.run(() => onSubscribe(!subscribed))}
          >
            <Icon name={subscribed ? "check" : "updates"} />
            {subscribed
              ? t("Subscribed to updates")
              : t("Get updates by email")}
          </button>
          {action.error && (
            <p className="qb-form-error" role="alert">
              {action.error}
            </p>
          )}
        </div>
      )}
      {entries[0] ? (
        <>
          <UpdateCard
            entry={entries[0]}
            onOpen={() => onOpen(entries[0]!.id)}
          />
          <UpdateActions
            key={entries[0].id}
            entry={entries[0]}
            onReact={onReact}
            onShare={onShare}
          />
          {entries.length > 1 && (
            <>
              <h2 className="qb-section-label">{t("Earlier")}</h2>
              {entries.slice(1).map((entry) => (
                <button
                  type="button"
                  className="qb-earlier"
                  key={entry.id}
                  onClick={() => onOpen(entry.id)}
                >
                  <strong>{entry.title}</strong>
                  <span>{updateDate(entry, locale)}</span>
                </button>
              ))}
            </>
          )}
        </>
      ) : (
        <div className="qb-empty">
          <span className="qb-empty-icon">
            <Icon name="updates" />
          </span>
          <h2>{t("No updates yet.")}</h2>
          <p>{t("Check back soon for the latest news.")}</p>
        </div>
      )}
    </div>
  );
}
