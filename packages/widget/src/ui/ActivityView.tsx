import { Icon } from "./Icon.js";
import { messageTime } from "./message-time.js";
import { useAction } from "./useAction.js";
import type { RequestActivity, WidgetViewProps } from "./types.js";
import { useLocale, useT } from "./i18n/useT.js";

export function ActivityView({
  activities,
  onOpen,
  onRead,
  offline,
}: {
  activities: readonly RequestActivity[];
  onOpen: (id: string) => void;
  onRead?: WidgetViewProps["onReadActivity"];
  offline: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const action = useAction();
  return (
    <section className="qb-activity-view">
      <h1>{t("Activity")}</h1>
      <p className="qb-section-description">
        {t("Replies and progress on requests you follow.")}
      </p>
      {!activities.length && (
        <p className="qb-empty">
          {t("Follow a request to see its updates here.")}
        </p>
      )}
      <ul className="qb-activity-list">
        {activities.map((item) => {
          const state = action.forKey(item.id);
          const stamp = messageTime(item.createdAt, locale);
          return (
            <li key={item.id} data-unread={item.unread}>
              <button
                type="button"
                className="qb-activity-open"
                onClick={() => onOpen(item.postId)}
              >
                <Icon
                  name={
                    item.kind === "shipped"
                      ? "check"
                      : item.kind === "reply"
                        ? "messages"
                        : "feedback"
                  }
                />
                <span>
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                  {stamp && (
                    <time dateTime={stamp.iso}>
                      {stamp.day} · {stamp.time}
                    </time>
                  )}
                </span>
                {item.unread && (
                  <span className="qb-unread-dot" aria-label={t("Unread")} />
                )}
              </button>
              {item.unread && onRead && (
                <button
                  type="button"
                  className="qb-text-button"
                  disabled={offline || state.pending}
                  onClick={() =>
                    void action.run(() => onRead(item.id), item.id)
                  }
                >
                  {state.pending ? t("Marking as read…") : t("Mark as read")}
                </button>
              )}
              {state.error && (
                <p role="alert" className="qb-form-error">
                  {state.error}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
