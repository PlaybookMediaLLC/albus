import { ContactEmailCard } from "./ContactEmailCard.js";
import { Icon } from "./Icon.js";
import type { Conversation, ContactEmail, WidgetViewProps } from "./types.js";
import { useT } from "./i18n/useT.js";

export function MessagesView({
  conversations,
  onOpen,
  onCompose,
  contactEmail,
  onRequestContactEmail,
  onConfirmContactEmail,
  offline,
}: {
  conversations: readonly Conversation[];
  onOpen: (id: string) => void;
  onCompose: () => void;
  contactEmail?: ContactEmail;
  onRequestContactEmail?: WidgetViewProps["onRequestContactEmail"];
  onConfirmContactEmail?: WidgetViewProps["onConfirmContactEmail"];
  offline?: boolean;
}) {
  const t = useT();
  return (
    <div className="qb-list-view">
      <h1>{t("Messages")}</h1>
      {contactEmail &&
        conversations.length > 0 &&
        onRequestContactEmail &&
        onConfirmContactEmail && (
          <ContactEmailCard
            contact={contactEmail}
            onRequest={onRequestContactEmail}
            onConfirm={onConfirmContactEmail}
            offline={offline}
          />
        )}
      {conversations.length ? (
        conversations.map((conversation) => (
          <button
            type="button"
            key={conversation.id}
            className="qb-conversation"
            onClick={() => onOpen(conversation.id)}
          >
            <span className="qb-avatar">
              <Icon name="messages" />
            </span>
            <span>
              <strong>{conversation.title}</strong>
              <small>
                {conversation.messages[conversation.messages.length - 1]?.body}
              </small>
            </span>
            {(conversation.unreadCount ?? 0) > 0 && (
              <span
                className="qb-unread-count"
                aria-label={t("{count} unread replies", {
                  count: conversation.unreadCount ?? 0,
                })}
              >
                {conversation.unreadCount}
              </span>
            )}
            <Icon name="chevron" />
          </button>
        ))
      ) : (
        <>
          <div className="qb-message-illustration" aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <div key={row}>
                <i />
                <span>
                  <i />
                  <i />
                </span>
              </div>
            ))}
          </div>
          <div className="qb-message-empty">
            <h2>{t("No conversations yet")}</h2>
            <p>
              {t("Send us a message and we’ll be happy to help.")}
              <br />
              {t("Your conversations will appear here.")}
            </p>
          </div>
        </>
      )}
      <div className="qb-floating-action">
        <button type="button" className="qb-primary" onClick={onCompose}>
          <Icon name="pen" />
          {t("New conversation")}
        </button>
      </div>
    </div>
  );
}
