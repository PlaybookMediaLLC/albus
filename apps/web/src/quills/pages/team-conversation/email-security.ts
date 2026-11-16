import type { ListConversationMessagesResponse } from "../../api/team/list-conversation-messages";

type Message = ListConversationMessagesResponse["items"][number];

/** The checks of the newest inbound mail that has them. The API sends messages newest first. */
export function emailSecurityOf(messages: readonly Message[] = []) {
  const checked = messages.find((message) => message.emailAuth);
  return checked?.emailAuth
    ? { auth: checked.emailAuth, receivedAt: checked.createdAt }
    : null;
}
