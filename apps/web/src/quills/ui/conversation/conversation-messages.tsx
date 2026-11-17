import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DateSeparator } from "../inbox/date-separator";
import { MessageBubble } from "../inbox/message-bubble";
import { SystemEvent } from "../inbox/system-event";
import { arrivedClass, useArrived } from "../inbox/use-arrived";
import { cn } from "../upstream";

type Attachment = { fileId?: string | null; name: string };

export interface ConversationMessagesProps {
  messages: Array<{
    id: string;
    fromVisitor: boolean;
    senderType: string;
    author: { name: string | null } | null;
    content: string;
    attachments: Attachment[];
    createdAt: string;
  }>;
  /** Renders a file that has an ID, such as a download link; otherwise its name shows. */
  renderAttachment?: (attachment: Attachment & { fileId: string }) => ReactNode;
}

const day = (iso: string) => new Date(iso).toDateString();

/** The customer's thread, with the bubbles of the teammate inbox: the customer's own messages on the right. */
export function ConversationMessages({
  messages,
  renderAttachment,
}: ConversationMessagesProps) {
  const { t } = useTranslation("quills");
  const arrived = useArrived(
    messages.map((message) => message.id),
    "thread",
  );
  return (
    <section
      className="portal-messages mt-8"
      aria-labelledby="conversation-messages-heading"
    >
      <h2
        id="conversation-messages-heading"
        className="mb-5 text-base font-medium"
      >
        {t("conversation.messages")}
      </h2>
      {messages.length ? (
        <ol className="grid gap-3">
          {messages.map((message, index) => (
            <li
              key={message.id}
              className={cn("grid gap-3", arrived(message.id) && arrivedClass)}
            >
              {index === 0 ||
              day(messages[index - 1]!.createdAt) !== day(message.createdAt) ? (
                <DateSeparator date={message.createdAt} />
              ) : null}
              {message.senderType === "system" ? (
                <SystemEvent time={message.createdAt}>
                  {message.content}
                </SystemEvent>
              ) : (
                <MessageBubble
                  kind={message.fromVisitor ? "self" : "other"}
                  avatar={!message.fromVisitor}
                  author={{
                    name: message.fromVisitor
                      ? t("conversation.you")
                      : message.author?.name?.trim() ||
                        t("conversation.support"),
                  }}
                  time={message.createdAt}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.attachments.map(({ fileId, name }, index) => (
                    <p
                      key={fileId ?? `${message.id}:${index}`}
                      className="mt-1 text-xs opacity-80"
                    >
                      {fileId && renderAttachment
                        ? renderAttachment({ fileId, name })
                        : t("conversation.attachment", { name })}
                    </p>
                  ))}
                </MessageBubble>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("conversation.noMessages")}
        </p>
      )}
    </section>
  );
}
