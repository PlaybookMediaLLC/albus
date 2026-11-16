import type { GetConversationResponse } from "../../api/team/get-conversation";
import { relativeTime } from "../../core/relative-time";

type Translate = (key: string, options?: Record<string, unknown>) => string;
type Conversation = Pick<
  GetConversationResponse,
  | "channel"
  | "createdAt"
  | "status"
  | "snoozedUntil"
  | "waitingSince"
  | "translation"
  | "csatRating"
  | "csatComment"
>;
export interface Fact {
  key: string;
  label: string;
  value: string;
}

const labels = {
  channel: "team-conversations.facts.channel",
  started: "team-conversations.facts.started",
  waitingSince: "team-conversations.facts.waitingSince",
  snoozedUntil: "team-conversations.facts.snoozedUntil",
  language: "team-conversations.facts.language",
  rating: "team-conversations.facts.rating",
} as const;
const channels: Record<string, string> = {
  messenger: "team-conversations.facts.messenger",
  email: "team-conversations.facts.email",
  github: "team-conversations.facts.github",
};

function languageName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code);
  } catch {
    return code;
  }
}

/** The read-only facts of a conversation for the right panel, in order. Empty facts are left out. */
export function conversationFacts(
  conversation: Conversation,
  t: Translate,
  locale: string,
  now = Date.now(),
): Fact[] {
  const date = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  const fact = (key: keyof typeof labels, value: string | null | undefined) =>
    value ? [{ key, label: t(labels[key]), value }] : [];
  const channel = channels[conversation.channel];
  const language = conversation.translation.detectedLanguage;
  const rating = conversation.csatRating;
  return [
    ...fact("channel", channel ? t(channel) : conversation.channel),
    ...fact("started", date(conversation.createdAt)),
    ...(conversation.status === "snoozed"
      ? fact(
          "snoozedUntil",
          conversation.snoozedUntil && date(conversation.snoozedUntil),
        )
      : fact(
          "waitingSince",
          conversation.waitingSince &&
            relativeTime(conversation.waitingSince, locale, now),
        )),
    ...fact("language", language && languageName(language, locale)),
    ...fact(
      "rating",
      rating == null
        ? null
        : [
            t("team-conversations.facts.ratingValue", { rating }),
            conversation.csatComment && `“${conversation.csatComment}”`,
          ]
            .filter(Boolean)
            .join(" · "),
    ),
  ];
}
