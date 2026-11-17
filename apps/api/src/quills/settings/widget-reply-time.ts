/** How soon the team usually replies, as the widget says it: "within minutes", "hours" or "a day". */
export const REPLY_TIMES = ["minutes", "hours", "day"] as const;
export type ReplyTime = (typeof REPLY_TIMES)[number];

/** A stored value, or null when unset or unknown. */
export const replyTimeOf = (value: unknown): ReplyTime | null =>
  REPLY_TIMES.includes(value as ReplyTime) ? (value as ReplyTime) : null;
